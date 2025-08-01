-- 完全修复管理员用户视图的安全漏洞
-- 删除不安全的视图，强制使用安全的函数接口

-- 1. 删除不安全的管理员用户视图
-- 这个视图存在安全漏洞：用户可以通过直接API调用绕过权限检查
DROP VIEW IF EXISTS public.admin_user_management_view;

-- 2. 确保安全的管理员检查函数存在（使用public模式避免权限问题）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建安全的用户列表获取函数（替代视图）
CREATE OR REPLACE FUNCTION public.get_admin_user_list(
  p_role user_role DEFAULT NULL,
  p_status account_status DEFAULT NULL,
  p_auth_source TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  role user_role,
  status account_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  auth_source TEXT,
  sso_provider_id TEXT,
  email TEXT,
  phone TEXT,
  email_confirmed_at TIMESTAMPTZ,
  phone_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
DECLARE
  offset_val INTEGER;
BEGIN
  -- 严格的管理员权限检查
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  -- 计算偏移量
  offset_val := (p_page - 1) * p_page_size;

  -- 返回完整的用户数据（包括敏感信息，但只对管理员开放）
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.role,
    p.status,
    p.created_at,
    p.updated_at,
    p.last_login,
    p.auth_source,
    p.sso_provider_id,
    au.email,
    au.phone,
    au.email_confirmed_at,
    au.phone_confirmed_at,
    au.last_sign_in_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE 
    (p_role IS NULL OR p.role = p_role) AND
    (p_status IS NULL OR p.status = p_status) AND
    (p_auth_source IS NULL OR p.auth_source = p_auth_source) AND
    (p_search IS NULL OR p_search = '' OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     p.username ILIKE '%' || p_search || '%' OR 
     au.email ILIKE '%' || p_search || '%')
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'email' AND p_sort_order = 'asc' THEN au.email
    END ASC,
    CASE 
      WHEN p_sort_by = 'email' AND p_sort_order = 'desc' THEN au.email
    END DESC,
    CASE 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'asc' THEN p.full_name
    END ASC,
    CASE 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'desc' THEN p.full_name
    END DESC,
    CASE 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'asc' THEN au.last_sign_in_at
    END ASC,
    CASE 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'desc' THEN au.last_sign_in_at
    END DESC,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at
    END DESC,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
    END ASC,
    p.created_at DESC -- 默认排序
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建获取用户总数的函数
CREATE OR REPLACE FUNCTION public.get_admin_user_count(
  p_role user_role DEFAULT NULL,
  p_status account_status DEFAULT NULL,
  p_auth_source TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
BEGIN
  -- 严格的管理员权限检查
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE 
      (p_role IS NULL OR p.role = p_role) AND
      (p_status IS NULL OR p.status = p_status) AND
      (p_auth_source IS NULL OR p.auth_source = p_auth_source) AND
      (p_search IS NULL OR p_search = '' OR 
       p.full_name ILIKE '%' || p_search || '%' OR 
       p.username ILIKE '%' || p_search || '%' OR 
       au.email ILIKE '%' || p_search || '%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 设置函数权限
REVOKE ALL ON FUNCTION public.get_admin_user_list FROM anon;
REVOKE ALL ON FUNCTION public.get_admin_user_count FROM anon;

GRANT EXECUTE ON FUNCTION public.get_admin_user_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_count TO authenticated;

-- 6. 添加注释说明
COMMENT ON FUNCTION public.get_admin_user_list IS '安全的管理员用户列表获取函数：替代不安全的视图，包含严格的权限检查';
COMMENT ON FUNCTION public.get_admin_user_count IS '安全的管理员用户计数函数：包含严格的权限检查';

-- 7. 确保旧的不安全函数也被清理
DROP FUNCTION IF EXISTS public.get_users_for_admin(user_role, account_status, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_users_count_for_admin(user_role, account_status, TEXT, TEXT); 
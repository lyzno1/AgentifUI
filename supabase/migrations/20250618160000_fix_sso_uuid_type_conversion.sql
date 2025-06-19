-- --- BEGIN COMMENT ---
-- 修复SSO数据库函数中的UUID类型转换问题
-- 问题：column "sso_provider_id" is of type uuid but expression is of type text
-- 原因：create_sso_user函数中错误地将UUID转换为TEXT类型
-- 解决：移除错误的::TEXT转换，直接使用UUID类型
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 修复 create_sso_user 函数的UUID类型转换问题
-- 根据数据库设计文档，profiles表中sso_provider_id字段是UUID类型
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION create_sso_user(
  emp_number TEXT,
  user_name TEXT,
  sso_provider_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- --- BEGIN COMMENT ---
  -- 验证输入参数
  -- --- END COMMENT ---
  IF emp_number IS NULL OR LENGTH(TRIM(emp_number)) = 0 THEN
    RAISE EXCEPTION 'Employee number cannot be null or empty';
  END IF;
  
  IF user_name IS NULL OR LENGTH(TRIM(user_name)) = 0 THEN
    RAISE EXCEPTION 'Username cannot be null or empty';
  END IF;
  
  IF sso_provider_uuid IS NULL THEN
    RAISE EXCEPTION 'SSO provider UUID cannot be null';
  END IF;

  -- --- BEGIN COMMENT ---
  -- 检查学工号是否已存在
  -- --- END COMMENT ---
  IF EXISTS (SELECT 1 FROM profiles WHERE employee_number = TRIM(emp_number)) THEN
    RAISE EXCEPTION 'Employee number % already exists', emp_number;
  END IF;

  -- 生成新的用户ID
  new_user_id := gen_random_uuid();
  
  -- --- BEGIN COMMENT ---
  -- 确保用户名唯一，如果冲突则添加数字后缀
  -- --- END COMMENT ---
  final_username := TRIM(user_name);
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := TRIM(user_name) || '_' || counter;
  END LOOP;
  
  -- --- BEGIN COMMENT ---
  -- 创建用户记录，确保数据类型正确匹配
  -- 关键修复：sso_provider_id字段是UUID类型，直接使用UUID值，不转换为TEXT
  -- --- END COMMENT ---
  INSERT INTO profiles (
    id,
    employee_number,
    username,
    full_name,
    auth_source,
    sso_provider_id,
    status,
    role,
    created_at,
    updated_at,
    last_login
  ) VALUES (
    new_user_id,
    TRIM(emp_number),
    final_username,
    TRIM(user_name),
    'bistu_sso',                     -- TEXT类型值
    sso_provider_uuid,               -- 直接使用UUID类型，移除错误的::TEXT转换
    'active'::account_status,        -- 枚举类型
    'user'::user_role,              -- 枚举类型
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- --- BEGIN COMMENT ---
    -- 记录详细错误信息并重新抛出
    -- --- END COMMENT ---
    RAISE EXCEPTION 'Failed to create SSO user: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 2. 更新函数注释和权限
-- --- END COMMENT ---
COMMENT ON FUNCTION create_sso_user(TEXT, TEXT, UUID) IS 
'创建北信SSO用户账户，修复了UUID类型转换问题 - sso_provider_id直接使用UUID类型';

-- --- BEGIN COMMENT ---
-- 3. 确保函数权限正确设置
-- --- END COMMENT ---
GRANT EXECUTE ON FUNCTION create_sso_user(TEXT, TEXT, UUID) TO service_role;

-- --- BEGIN COMMENT ---
-- 修复说明：
-- 1. 移除了错误的 sso_provider_uuid::TEXT 转换
-- 2. 直接使用 UUID 类型值插入到 sso_provider_id 字段
-- 3. 这解决了 "column sso_provider_id is of type uuid but expression is of type text" 错误
-- 4. 符合数据库设计文档中 profiles.sso_provider_id 为 UUID 类型的定义
-- --- END COMMENT ---

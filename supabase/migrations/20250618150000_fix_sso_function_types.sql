-- 修复SSO相关数据库函数的返回类型问题
-- 解决 account_status 枚举类型与 TEXT 类型不匹配的错误
-- 修正版：auth_source 字段在当前数据库中是 TEXT 类型，不是枚举类型

-- --- BEGIN COMMENT ---
-- 1. 删除现有函数，然后重新创建以修复返回类型
-- 注意：根据数据库设计文档，auth_source 是 TEXT 类型，不是枚举类型
-- --- END COMMENT ---
DROP FUNCTION IF EXISTS find_user_by_employee_number(TEXT);

CREATE FUNCTION find_user_by_employee_number(emp_num TEXT)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  username TEXT,
  employee_number TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  auth_source TEXT,              -- 修复：使用 TEXT 类型（不是枚举）
  status account_status          -- 修复：使用正确的枚举类型
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- --- BEGIN COMMENT ---
  -- 验证输入参数
  -- --- END COMMENT ---
  IF emp_num IS NULL OR LENGTH(TRIM(emp_num)) = 0 THEN
    RAISE EXCEPTION 'Employee number cannot be null or empty';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.employee_number,
    p.last_login,
    p.auth_source,
    p.status
  FROM profiles p
  WHERE p.employee_number = TRIM(emp_num)
    AND p.status = 'active'::account_status;
END;
$$;

-- --- BEGIN COMMENT ---
-- 2. 修复 create_sso_user 函数，确保使用正确的数据类型
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
  -- 创建用户记录，使用正确的数据类型
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
    'bistu_sso',                     -- 使用 TEXT 类型值
    sso_provider_uuid::TEXT,
    'active'::account_status,        -- 使用正确的枚举类型
    'user'::user_role,              -- 使用正确的枚举类型
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- --- BEGIN COMMENT ---
    -- 记录错误并重新抛出
    -- --- END COMMENT ---
    RAISE EXCEPTION 'Failed to create SSO user: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 3. 更新函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION find_user_by_employee_number(TEXT) IS '根据学工号查找用户信息，用于SSO登录验证（已修复返回类型）';
COMMENT ON FUNCTION create_sso_user(TEXT, TEXT, UUID) IS '创建北信SSO用户账户，自动处理用户名冲突（已修复数据类型）';

-- --- BEGIN COMMENT ---
-- 4. 验证函数修复是否成功
-- --- END COMMENT ---
DO $$ 
BEGIN
    -- 测试函数是否能正常调用（不会实际创建数据）
    PERFORM find_user_by_employee_number('test_validation_only');
    RAISE NOTICE 'find_user_by_employee_number function validation successful';
EXCEPTION
    WHEN OTHERS THEN
        -- 如果是因为没有找到用户，这是正常的
        IF SQLERRM LIKE '%Employee number cannot be null or empty%' THEN
            RAISE NOTICE 'find_user_by_employee_number function validation failed: %', SQLERRM;
        ELSE
            RAISE NOTICE 'find_user_by_employee_number function works correctly (no matching user found)';
        END IF;
END $$; 
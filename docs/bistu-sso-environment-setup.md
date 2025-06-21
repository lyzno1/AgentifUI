# 北京信息科技大学SSO环境配置指南

## 环境变量配置

在项目根目录的 `.env.local` 文件中添加以下配置：

```bash
# --- BEGIN COMMENT ---
# 北京信息科技大学SSO配置
# ⚠️ 重要：以下配置需要根据您的实际环境进行调整
# --- END COMMENT ---

# 北信科CAS服务器地址（通常不需要修改）
BISTU_SSO_BASE_URL=https://sso.bistu.edu.cn

# 当前应用的完整URL（用于构建回调地址）
# ⚠️ 必须配置：请替换为您的实际域名
NEXT_PUBLIC_APP_URL=https://your-domain.com

# CAS协议版本（可选，默认2.0）
BISTU_CAS_VERSION=2.0

# ⚠️ 新增：Supabase Service Role密钥（SSO用户创建必需）
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 北信科专用模式（可选，设为true则只显示SSO登录）
NEXT_PUBLIC_SSO_ONLY_MODE=false
```

## Supabase配置要求

### Service Role密钥获取

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 `Settings` → `API`
4. 复制 `service_role` 密钥（⚠️ 不是 `anon` 密钥）
5. 将密钥添加到 `SUPABASE_SERVICE_ROLE_KEY` 环境变量

⚠️ **安全警告**: Service Role密钥具有完全数据库访问权限，仅在服务器端使用，切勿泄露！

### 数据库迁移

确保应用了最新的SSO迁移文件：

```bash
# 查看迁移状态
supabase migration list

# 应用所有迁移
supabase db push
```

关键迁移文件：
- `20250617185201_fix_enum_transaction_issue.sql` - 添加CAS协议支持
- `20250617185202_add_bistu_sso_data.sql` - 创建SSO数据结构和函数
- `20250618150000_fix_sso_function_types.sql` - 修复数据库函数类型

## 配置说明

### 必须配置的变量

1. **NEXT_PUBLIC_APP_URL**
   - 当前应用的完整URL
   - 开发环境示例：`http://localhost:3000`
   - 生产环境示例：`https://your-app.com`
   - 用于构建CAS回调地址：`${NEXT_PUBLIC_APP_URL}/api/sso/bistu/callback`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Supabase Service Role密钥
   - 用于SSO用户创建和管理
   - ⚠️ 仅在服务器端使用，具有完全数据库权限

### 可选配置的变量

1. **BISTU_SSO_BASE_URL**
   - 北信科CAS服务器地址
   - 默认值：`https://sso.bistu.edu.cn`
   - 通常不需要修改

2. **BISTU_CAS_VERSION**
   - CAS协议版本
   - 默认值：`2.0`
   - 可选值：`2.0` 或 `3.0`

3. **NEXT_PUBLIC_SSO_ONLY_MODE**
   - 北信科专用模式开关
   - 设为 `true` 时仅显示SSO登录选项
   - 设为 `false` 时显示所有登录方式
   - 默认值：`false`

## SSO集成架构

### 认证流程

```
用户访问 → 点击SSO登录 → 重定向到CAS
     ↓
CAS验证成功 → 回调应用 → 验证ticket → 创建/查找用户
     ↓
设置cookie → 前端处理 → 调用SSO登录API → 建立Supabase会话
     ↓
跳转目标页面 → 完成登录
```

### 关键API端点

| 端点 | 功能 | 方法 |
|------|------|------|
| `/api/sso/bistu/login` | SSO登录入口 | GET |
| `/api/sso/bistu/callback` | CAS回调处理 | GET |
| `/api/sso/bistu/logout` | SSO注销 | GET/POST |
| `/api/auth/sso-signin` | SSO会话建立 | POST |

### 数据库结构

- **profiles表扩展**：添加 `employee_number` 字段存储学工号
- **sso_providers表**：存储北信科CAS配置信息
- **数据库函数**：
  - `find_user_by_employee_number()` - 通过学工号查找用户
  - `create_sso_user()` - 创建SSO用户
  - `update_sso_user_login()` - 更新登录时间

## 部署配置检查清单

### 开发环境

- [ ] 设置 `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] 配置 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 运行数据库迁移：`supabase db push`
- [ ] 安装依赖：`pnpm install fast-xml-parser`
- [ ] 验证SSO按钮显示正常

### 生产环境

- [ ] 设置正确的 `NEXT_PUBLIC_APP_URL`（必须是HTTPS）
- [ ] 配置生产环境的 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 确保HTTPS证书配置正确
- [ ] 运行数据库迁移
- [ ] 测试完整SSO登录流程
- [ ] 验证用户创建和会话管理

## 安全注意事项

1. **HTTPS要求**
   - 生产环境必须使用HTTPS
   - CAS协议要求安全连接
   - Service回调URL必须使用HTTPS

2. **密钥安全**
   - `SUPABASE_SERVICE_ROLE_KEY` 具有完全数据库权限
   - 切勿在客户端代码中使用Service Role密钥
   - 定期轮换访问密钥

3. **会话管理**
   - SSO用户数据cookie设置24小时过期
   - 临时密码自动清理
   - 支持安全的会话建立机制

4. **重定向安全**
   - 实施了安全的重定向URL验证
   - 只允许预定义的内部路径
   - 防止开放重定向攻击

## 故障排查

### 常见问题

1. **"NEXT_PUBLIC_APP_URL environment variable is required"**
   - 检查环境变量是否正确配置
   - 确保没有拼写错误

2. **"Ticket validation failed"**
   - 检查网络连接到CAS服务器
   - 验证service URL是否与登录时一致
   - 确认HTTPS配置正确

3. **"User creation failed"**
   - 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否配置
   - 验证数据库迁移是否成功应用
   - 检查数据库连接状态

4. **SSO会话建立失败**
   - 检查cookie设置是否正确
   - 验证SSO登录API `/api/auth/sso-signin` 是否可访问
   - 查看浏览器控制台错误信息

### 调试方法

1. **开启详细日志**
   ```bash
   # 查看SSO相关日志
   tail -f /var/log/your-app.log | grep -i sso
   ```

2. **检查数据库状态**
   ```sql
   -- 检查SSO提供商配置
   SELECT * FROM sso_providers WHERE name = '北京信息科技大学';
   
   -- 检查用户创建情况
   SELECT id, username, employee_number, auth_source 
   FROM profiles 
   WHERE auth_source = 'bistu_sso';
   ```

3. **测试CAS连接**
   ```bash
   # 测试CAS服务器连通性
   curl -I https://sso.bistu.edu.cn/login
   ```

## 快速验证

部署完成后，进行以下验证：

1. **环境检查**：访问 `/login` 页面，确认显示北信科SSO登录按钮
2. **重定向测试**：点击按钮，确认正确重定向到CAS服务器
3. **回调测试**：在CAS完成登录，确认能正确回调到应用
4. **用户创建**：首次登录用户应自动创建账户
5. **会话管理**：确认登录后能正常访问受保护页面

如遇问题，请查看服务器日志并参考故障排查部分。 
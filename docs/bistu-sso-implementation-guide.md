# 北京信息科技大学SSO实施指南

基于技术方案文档 `bistu-sso-integration-guide.md` 的具体实施步骤。

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install fast-xml-parser
```

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# ⚠️ 必须配置 - 请替换为您的实际域名
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 开发环境
# NEXT_PUBLIC_APP_URL=https://your-domain.com  # 生产环境

# ⚠️ 必须配置 - Supabase Service Role密钥
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 可选配置
BISTU_SSO_BASE_URL=https://sso.bistu.edu.cn
BISTU_CAS_VERSION=2.0

# 北信科专用模式（仅显示SSO登录选项）
NEXT_PUBLIC_SSO_ONLY_MODE=false
```

### 3. 运行数据库迁移

```bash
# 查看迁移状态
supabase migration list

# 应用SSO支持迁移
supabase db push
```

### 4. 验证集成

1. 启动开发服务器：`pnpm run dev`
2. 访问登录页面，应该能看到"北京信息科技大学统一认证"按钮
3. 点击按钮测试重定向到CAS服务器

## 📁 已创建的文件

### 后端实现

- `supabase/migrations/20250617185201_fix_enum_transaction_issue.sql` - 添加CAS协议支持
- `supabase/migrations/20250617185202_add_bistu_sso_data.sql` - 完整SSO数据结构和函数
- `supabase/migrations/20250618150000_fix_sso_function_types.sql` - 修复函数类型问题
- `lib/services/sso/bistu-cas-service.ts` - 增强的CAS服务实现
- `lib/services/user/sso-user-service.ts` - 完善的用户管理服务
- `lib/supabase/server.ts` - 新增Admin客户端支持
- `app/api/sso/bistu/login/route.ts` - 登录入口API
- `app/api/sso/bistu/callback/route.ts` - 回调处理API（含邮箱冲突处理）
- `app/api/sso/bistu/logout/route.ts` - 注销处理API
- `app/api/auth/sso-signin/route.ts` - **新增**：SSO会话建立API

### 前端实现

- `components/auth/bistu-sso-button.tsx` - SSO登录按钮组件（含多种样式）
- `components/auth/login-form.tsx` - 已集成SSO按钮和自动会话处理
- `middleware.ts` - 中间件SSO状态检测和认证跳过

### 配置和文档

- `docs/bistu-sso-environment-setup.md` - 环境配置指南（已更新）
- `docs/bistu-sso-integration-guide.md` - 技术方案文档
- `docs/sso-callback-error-fix-guide.md` - SSO回调错误修复指南

## ⚠️ 需要您配置的内容

### 1. 环境变量配置

在 `.env.local` 中设置：

```bash
# 🔧 必须修改：您的应用URL
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com

# 🔧 必须修改：Supabase Service Role密钥
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

获取Service Role密钥：
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → Settings → API
3. 复制 `service_role` 密钥（⚠️ 不是 `anon` 密钥）

### 2. 学工号格式验证（如需调整）

如果北信科的学工号格式不是10位数字，请修改：

**文件**: `lib/services/sso/bistu-cas-service.ts`
**行数**: 约第267行（validateEmployeeNumber函数）

```typescript
// TODO: 请根据实际的学工号格式调整此正则表达式
const pattern = /^\d{10}$/;  // 修改为实际格式
```

**文件**: `lib/services/user/sso-user-service.ts`
**行数**: 约第621行（validateEmployeeNumber函数）

```typescript
// TODO: 请根据实际的学工号格式调整此正则表达式
const pattern = /^\d{10}$/;  // 修改为实际格式
```

### 3. 允许的重定向URL列表

**文件**: `app/api/sso/bistu/login/route.ts`
**行数**: 约第18行

```typescript
// 🔧 根据需要添加允许的重定向路径
const allowedReturnUrls = [
  '/chat',
  '/dashboard', 
  '/settings',
  '/apps',
  '/', // 首页
  // 添加您需要的其他路径
];
```

### 4. 北信科专用模式配置

如需启用仅SSO登录模式，设置环境变量：

```bash
NEXT_PUBLIC_SSO_ONLY_MODE=true
```

启用后登录页面将：
- 仅显示北信科SSO登录选项
- 隐藏邮箱密码和社交登录
- 提供更简洁的认证体验

## 🔧 核心功能说明

### 1. 增强的CAS服务

`lib/services/sso/bistu-cas-service.ts` 提供：
- CAS 2.0/3.0协议支持
- XML响应解析和调试
- 类型安全的数据处理
- 超时和错误处理

关键特性：
```typescript
// 支持原始XML响应调试
interface BistuUserInfo {
  employeeNumber: string;
  username: string;
  success: boolean;
  attributes?: {
    name?: string;         // 真实姓名
    username?: string;     // 学工号
    [key: string]: any;
  };
  rawResponse?: string;    // 原始XML响应
}
```

### 2. 完善的用户管理服务

`lib/services/user/sso-user-service.ts` 实现：
- 邮箱冲突自动处理
- 多重用户查找策略
- Admin客户端权限管理
- 数据一致性保证

主要改进：
```typescript
// 通过邮箱查找用户（更可靠）
static async findUserByEmployeeNumber(employeeNumber: string): Promise<Profile | null> {
  // 构建邮箱：学工号@bistu.edu.cn
  const email = `${employeeNumber.trim()}@bistu.edu.cn`;
  
  // 先用普通客户端，失败则用Admin客户端
  // 确保能找到所有用户记录
}

// 邮箱冲突处理
if (authError && authError.message.includes('already been registered')) {
  // 重新查找现有用户
  // 智能链接账户
  // 数据一致性修复
}
```

### 3. SSO会话建立API

`app/api/auth/sso-signin/route.ts` 提供：
- 安全的会话建立机制
- 临时密码方法
- 请求去重处理
- 完善的错误处理

工作流程：
```typescript
// 1. 验证SSO数据有效性
// 2. 生成临时密码
// 3. 使用Admin API设置密码
// 4. 通过密码登录获取会话
// 5. 立即清理临时密码
// 6. 返回Supabase会话
```

### 4. 智能的前端集成

`components/auth/login-form.tsx` 实现：
- 自动SSO会话检测
- Cookie数据处理
- 状态管理和UI反馈
- 错误处理和重试机制

特性：
```typescript
// 自动检测SSO登录成功
const ssoLoginSuccess = searchParams.get('sso_login') === 'success';

// 处理SSO用户数据
const ssoUserData = JSON.parse(decodeURIComponent(ssoUserCookie.split('=')[1]));

// 调用SSO登录API建立会话
const response = await fetch('/api/auth/sso-signin', {
  method: 'POST',
  body: JSON.stringify({ userId, userEmail, ssoUserData }),
});
```

## 🧪 测试步骤

### 开发环境测试

1. **启动开发服务器**
   ```bash
   pnpm run dev
   ```

2. **访问登录页面**
   - 打开 `http://localhost:3000/login`
   - 确认能看到北信科SSO登录按钮

3. **测试SSO重定向**
   - 点击"使用北信科统一认证登录"按钮
   - 应该重定向到 `https://sso.bistu.edu.cn/login`

4. **测试回调处理**
   - 在CAS服务器完成登录后
   - 应该重定向回应用并自动建立会话

### 生产环境测试

1. **部署前检查**
   - 确认 `NEXT_PUBLIC_APP_URL` 配置正确
   - 确认HTTPS证书配置
   - 确认数据库迁移已应用

2. **功能测试**
   - 测试首次登录（应创建新用户）
   - 测试再次登录（应识别现有用户）
   - 测试注销功能
   - 测试邮箱冲突场景

3. **会话管理测试**
   - 验证登录后能访问受保护页面
   - 测试会话持久性
   - 验证注销后正确清理会话

## 🔍 调试信息

### 查看日志

SSO过程中的关键日志：

```bash
# 登录入口
SSO login initiated, return URL: /chat
Redirecting to CAS login: https://sso.bistu.edu.cn/login?service=***

# 回调处理
SSO callback received - ticket: present, returnUrl: /chat
Validating ticket with service URL: https://your-app.com/api/sso/bistu/callback
=== CAS原始XML响应内容 ===
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
  <cas:authenticationSuccess>
    <cas:user>2021011221</cas:user>
    <cas:attributes>
      <cas:name>张三</cas:name>
      <cas:username>2021011221</cas:username>
    </cas:attributes>
  </cas:authenticationSuccess>
</cas:serviceResponse>
=== CAS XML响应结束 ===

Ticket validation successful for employee: 2021011221
SSO login successful - User: 张三, Redirecting to login page

# 会话建立
Creating session using temporary password method...
SSO signin successful for user: uuid-here (processing time: 800ms)
```

### 数据库查询

检查SSO用户状态：

```sql
-- 查看SSO提供商配置
SELECT id, name, protocol, enabled 
FROM sso_providers 
WHERE name = '北京信息科技大学';

-- 查看SSO用户
SELECT id, username, full_name, employee_number, auth_source, last_login
FROM profiles 
WHERE auth_source = 'bistu_sso'
ORDER BY created_at DESC;

-- 检查邮箱冲突情况
SELECT 
  p.username, 
  p.employee_number, 
  p.email, 
  au.email as auth_email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.auth_source = 'bistu_sso';
```

### 常见错误及解决方案

1. **"NEXT_PUBLIC_APP_URL environment variable is required"**
   - 检查环境变量是否正确配置
   - 确保 `.env.local` 文件存在且可读

2. **"Ticket validation failed"**
   - 检查service URL是否与登录时一致
   - 检查网络连接到CAS服务器
   - 验证HTTPS配置正确

3. **"User creation failed" 或 "ACCOUNT_DATA_INCONSISTENT"**
   - 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否配置
   - 检查数据库迁移是否正确应用
   - 查看邮箱冲突处理日志

4. **SSO会话建立失败**
   - 检查 `/api/auth/sso-signin` 端点是否可访问
   - 验证cookie设置和读取
   - 查看浏览器控制台错误

5. **中间件认证冲突**
   - 确认中间件正确检测SSO状态
   - 检查cookie名称和格式
   - 验证认证跳过逻辑

## 📝 自定义指南

### 修改登录按钮样式

编辑 `components/auth/bistu-sso-button.tsx`：

```typescript
// 修改按钮颜色
"bg-blue-600 hover:bg-blue-700 text-white",

// 修改按钮文本
children || '使用北信科统一认证登录'

// 使用不同的按钮变体
<SimpleBistuSSOButton />      // 简化版
<BistuSSOCard />              // 卡片样式
<BistuSSOButton variant="outline" />  // 轮廓样式
```

### 添加CAS属性支持

如果CAS返回更多用户属性，修改：

**文件**: `lib/services/sso/bistu-cas-service.ts`
**函数**: `parseValidationResponse`

```typescript
// 添加更多属性解析
const userInfo = {
  username,
  employeeNumber,
  success: true,
  attributes: {
    name: String(attributes['cas:name'] || ''),           // 真实姓名
    department: String(attributes['cas:department'] || ''), // 部门
    studentType: String(attributes['cas:type'] || ''),     // 学生类型
    // 添加其他需要的属性
  },
};
```

### 自定义用户创建逻辑

修改 `lib/services/user/sso-user-service.ts` 中的 `createSSOUser` 方法：

```typescript
// 添加更多用户字段
const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
  email,
  user_metadata: {
    full_name: userData.fullName || userData.username,
    username: userData.username,
    employee_number: userData.employeeNumber,
    auth_source: 'bistu_sso',
    sso_provider_id: userData.ssoProviderId,
    department: userData.department,        // 新增
    student_type: userData.studentType,     // 新增
  },
  // ... 其他配置
});
```

### 集成现有认证系统

如果需要与其他认证系统共存：

1. **保持现有登录方式**：
   ```bash
   NEXT_PUBLIC_SSO_ONLY_MODE=false
   ```

2. **添加用户来源识别**：
   ```typescript
   // 在用户查询时区分认证来源
   const user = await supabase
     .from('profiles')
     .select('*')
     .eq('auth_source', 'bistu_sso')  // 仅查找SSO用户
     .single();
   ```

3. **权限和角色管理**：
   ```sql
   -- 为SSO用户设置特定角色
   UPDATE profiles 
   SET role = 'student' 
   WHERE auth_source = 'bistu_sso';
   ```

## 🚀 部署建议

### 生产环境配置

1. **使用HTTPS**
   - 配置SSL证书
   - 确保所有CAS通信使用HTTPS
   - 验证回调URL可访问

2. **数据库优化**
   - 创建适当的索引
   - 定期清理临时数据
   - 监控查询性能

3. **监控和告警**
   - 监控SSO登录成功率
   - 记录邮箱冲突处理次数
   - 设置自动化测试

4. **备份和恢复**
   - 定期备份用户数据
   - 准备故障恢复方案
   - 测试灾难恢复流程

### 性能优化

1. **缓存策略**
   - 缓存SSO提供商配置
   - 使用Redis缓存用户会话
   - 实施请求去重

2. **数据库优化**
   ```sql
   -- 添加性能索引
   CREATE INDEX IF NOT EXISTS idx_profiles_employee_number_active 
   ON profiles(employee_number) 
   WHERE employee_number IS NOT NULL AND status = 'active';
   
   -- 添加邮箱索引
   CREATE INDEX IF NOT EXISTS idx_profiles_email_bistu 
   ON profiles(email) 
   WHERE auth_source = 'bistu_sso';
   ```

### 安全加固

1. **环境变量保护**
   - 使用密钥管理服务
   - 定期轮换Service Role密钥
   - 监控密钥使用情况

2. **会话安全**
   - 实施会话超时
   - 使用安全的cookie设置
   - 添加CSRF保护

3. **日志和审计**
   - 记录所有SSO操作
   - 监控异常登录行为
   - 实施访问日志

## 📞 技术支持

如果遇到问题：

1. **查看错误日志**：检查服务器和浏览器控制台日志
2. **验证配置**：确认所有环境变量正确设置
3. **测试连接**：验证到CAS服务器的网络连接
4. **数据库检查**：确认迁移应用和数据完整性
5. **参考文档**：查看 `sso-callback-error-fix-guide.md` 进行故障排查

## 🎯 下一步优化

1. **功能增强**
   - 添加SSO用户同步功能
   - 实施批量用户管理
   - 支持多CAS服务器

2. **用户体验**
   - 添加登录进度指示
   - 优化错误提示信息
   - 支持记住登录状态

3. **管理功能**
   - SSO用户管理界面
   - 统计和分析面板
   - 配置管理工具

4. **技术改进**
   - 迁移到更现代的会话管理
   - 实施微服务架构
   - 添加负载均衡支持 
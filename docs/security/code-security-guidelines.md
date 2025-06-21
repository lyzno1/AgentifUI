# 代码安全规范

本文档规定了 AgentifUI 项目的代码安全开发规范，确保代码质量和系统安全。

## 前端安全规范

### 1. 输入验证与清理

```typescript
// ✅ 正确：使用zod进行输入验证
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(2, '用户名至少2位').max(20, '用户名最多20位')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(8, '密码至少8位')
})

// ❌ 错误：直接使用未验证的输入
const handleSubmit = (data: any) => {
  // 危险：未验证的数据直接使用
}
```

### 2. XSS 防护

```tsx
// ✅ 正确：使用React的自动转义
<div>{userInput}</div>

// ✅ 正确：使用DOMPurify清理HTML
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />

// ❌ 错误：直接插入HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 3. 敏感信息处理

```typescript
// ✅ 正确：环境变量管理
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  // 敏感信息不使用NEXT_PUBLIC_前缀
  secretKey: process.env.SECRET_KEY
}

// ❌ 错误：硬编码敏感信息
const API_KEY = 'sk-1234567890abcdef' // 危险
```

### 4. API 调用安全

```typescript
// ✅ 正确：使用认证头和错误处理
const fetchData = async () => {
  try {
    const response = await fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('请求失败')
    }
    
    return await response.json()
  } catch (error) {
    console.error('API调用失败:', error)
    // 不要暴露详细错误信息给用户
    throw new Error('操作失败，请稍后重试')
  }
}
```

## 后端安全规范

### 1. API 路由安全

```typescript
// ✅ 正确：验证用户权限
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // 验证用户身份
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }
  
  // 验证输入数据
  const body = await request.json()
  const validatedData = userSchema.parse(body)
  
  // 处理业务逻辑
}
```

### 2. 数据库查询安全

```typescript
// ✅ 正确：使用参数化查询（Supabase自动处理）
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)

// ✅ 正确：RLS策略保护
-- 在Supabase中设置行级安全策略
CREATE POLICY "用户只能访问自己的数据" ON profiles
  FOR ALL USING (auth.uid() = user_id);
```

### 3. 错误处理

```typescript
// ✅ 正确：安全的错误处理
try {
  // 业务逻辑
} catch (error) {
  console.error('详细错误信息:', error) // 仅记录到服务器日志
  
  // 返回通用错误信息，不暴露系统细节
  return NextResponse.json(
    { error: '操作失败，请稍后重试' },
    { status: 500 }
  )
}
```

## 依赖安全

### 1. 包管理

```bash
# 定期检查安全漏洞
pnpm audit

# 修复已知漏洞
pnpm audit --fix

# 更新依赖包
pnpm update
```

### 2. 依赖选择原则

- 优先选择维护活跃的包
- 检查包的下载量和社区评价
- 避免使用过时或废弃的包
- 定期审查和更新依赖

## 环境配置安全

### 1. 环境变量

```bash
# .env.local 示例
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 生产环境额外配置
NODE_ENV=production
```

### 2. 配置文件安全

- 敏感配置不提交到版本控制
- 使用 `.env.example` 提供配置模板
- 生产环境使用环境变量或密钥管理服务

## 代码审查清单

### 提交前检查

- [ ] 输入验证是否完整
- [ ] 是否存在硬编码的敏感信息
- [ ] API调用是否包含适当的错误处理
- [ ] 用户权限验证是否正确
- [ ] 是否遵循最小权限原则

### 审查重点

- [ ] 认证和授权逻辑
- [ ] 数据验证和清理
- [ ] 错误处理和日志记录
- [ ] 第三方依赖的安全性
- [ ] 配置文件的安全性

## 安全工具

### 开发工具

```bash
# ESLint 安全规则
pnpm add -D eslint-plugin-security

# TypeScript 严格模式
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true
```

### 测试工具

```bash
# 安全测试
pnpm run test:security

# 依赖漏洞扫描
pnpm audit
```

## 应急响应

### 发现安全问题时

1. **立即评估影响范围**
2. **通知团队负责人**
3. **记录问题详情**
4. **制定修复计划**
5. **实施修复措施**
6. **验证修复效果**
7. **更新安全文档**

### 联系方式

- 安全问题报告：security@company.com
- 紧急联系人：项目负责人

---

遵循这些安全规范，可以显著提高代码质量和系统安全性。所有开发人员都应该熟悉并严格执行这些规范。 
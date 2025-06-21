# AgentifUI 项目完整部署指南

本文档详细说明从零开始部署 AgentifUI 项目的完整流程，包括环境准备、Supabase 配置、环境变量设置和管理员账号创建。

## 📋 环境准备清单

### 1. 必需软件和工具

在开始之前，请确保您的系统上已安装以下工具：

| 工具 | 最低版本 | 推荐版本 | 安装方式 | 验证命令 |
|------|----------|----------|----------|----------|
| **Node.js** | 18.0.0+ | 22.15.0+ | [官网下载](https://nodejs.org/) | `node --version` |
| **pnpm** | 9.0.0+ | 10.11.0+ | `npm install -g pnpm` | `pnpm --version` |
| **Git** | 2.30.0+ | 2.39.5+ | [官网下载](https://git-scm.com/) | `git --version` |
| **Supabase CLI** | 1.0.0+ | 最新版 | `pnpm add -g supabase` | `supabase --version` |

### 2. 安装步骤

#### 安装 Node.js
```bash
# 方式1: 从官网下载安装包
# 访问 https://nodejs.org/ 下载 LTS 版本

# 方式2: 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.15.0
nvm use 22.15.0
```

#### 安装 pnpm
```bash
npm install -g pnpm
```

#### 安装 Supabase CLI
```bash
pnpm add -g supabase
```

## 🚀 项目克隆和依赖安装

### 1. 克隆项目
```bash
# 克隆项目代码库
git clone https://github.com/ifLabX/AgentifUI.git

# 进入项目目录
cd AgentifUI

# 安装项目依赖
pnpm install
```

### 2. 验证安装
```bash
# 检查所有工具版本
echo "=== 环境检查 ==="
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Git: $(git --version)"
echo "Supabase CLI: $(supabase --version)"
echo "==================="
```

## 🗄️ Supabase 项目创建和配置

### 1. 创建 Supabase 账号

1. 访问 [Supabase 注册页面](https://supabase.com/dashboard/sign-up)
2. 选择注册方式：
   - **推荐**: 使用 GitHub 账号登录（点击 "Continue with GitHub"）
   - 或使用邮箱注册（填写邮箱和密码）
3. 如果使用邮箱注册，需要验证邮箱地址

### 2. 创建组织（如果需要）

如果您是首次使用 Supabase：

1. 在控制台中点击 "Create Organization"
2. 输入组织名称（如 "Your Company"）
3. 选择类型（个人用户选择 "Personal"）
4. 选择计划（初期可选择 "Free - 0 USD/月"）
5. 点击 "Create Organization"

### 3. 创建新项目

1. 在 Supabase 控制台中点击 "New Project"
2. 配置项目信息：
   - **项目名称**: 输入项目名称（如 "AgentifUI"）
   - **数据库密码**: 设置强密码并保存（建议使用生成的强密码）
   - **地区**: 选择离您最近的地区（如 "Southeast Asia (Singapore)"）
   - **定价计划**: 选择合适的计划
3. 点击 "Create new project"
4. 等待项目创建完成（通常需要 1-2 分钟）

### 4. 获取 API 密钥和配置信息

项目创建完成后，获取必要的配置信息：

1. 在项目控制台中，点击左侧边栏的 **"Settings"** (齿轮图标)
2. 选择 **"API"** 选项卡
3. 记录以下信息：

#### 必需的配置信息：

| 配置项 | 位置 | 说明 |
|--------|------|------|
| **Project URL** | API Settings → URL | 项目的 API 地址，格式类似 `https://xxx.supabase.co` |
| **anon public** | API Settings → Project API keys | 匿名公共密钥，以 `eyJ` 开头的长字符串 |
| **service_role** | API Settings → Project API keys | 服务角色密钥，以 `eyJ` 开头，具有完整数据库权限 |

⚠️ **重要安全提示**：
- `anon public` 密钥可以在前端使用
- `service_role` 密钥具有完整数据库权限，**只能在服务器端使用，切勿泄露**

## ⚙️ 环境变量配置

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 在项目根目录执行
cp .env.local.example .env.local 2>/dev/null || touch .env.local
```

### 2. 配置环境变量

编辑 `.env.local` 文件，添加以下配置：

```ini
# ===========================================
# Supabase 配置 (必需)
# ===========================================

# Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 匿名公共密钥
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase 服务角色密钥（仅服务器端使用，切勿泄露）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# API 密钥加密配置 (必需)
# ===========================================

# API 密钥加密主密钥（32字节十六进制字符串）
# 可以使用以下命令生成: openssl rand -hex 32
API_ENCRYPTION_KEY=your_random_32_byte_hex_string_here

# ===========================================
# 应用配置 (可选)
# ===========================================

# 应用的完整 URL（用于回调等功能）
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# SSO 配置 (可选 - 如需北信科 SSO)
# ===========================================

# SSO专用模式（仅显示 SSO 登录）
NEXT_PUBLIC_SSO_ONLY_MODE=false
```

### 3. 生成 API 加密密钥

API_ENCRYPTION_KEY 用于加密存储在数据库中的 API 密钥。生成方法：

```bash
# 方法1: 使用 OpenSSL
openssl rand -hex 32

# 方法2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法3: 在线生成器
# 访问 https://www.random.org/strings/ 生成 64 位十六进制字符串
```

将生成的 64 位十六进制字符串设置为 `API_ENCRYPTION_KEY` 的值。

## 🔗 连接云端 Supabase

### 1. 登录 Supabase CLI

```bash
# 登录 Supabase
supabase login

# 按提示打开浏览器完成授权
```

### 2. 初始化和链接项目

```bash
# 链接到云端项目
supabase link --project-ref your-project-id

# 获取项目 ID: 在 Supabase 控制台的项目 URL 中
# 例如: https://supabase.com/dashboard/project/abcdefghijklmnop
# 项目 ID 就是: abcdefghijklmnop
```

### 3. 运行数据库迁移

```bash
# 推送所有数据库迁移到云端
supabase db push

# 验证迁移是否成功
supabase migration list
```

如果遇到迁移问题，可以查看具体错误：

```bash
# 查看迁移状态
supabase status

# 重置并重新推送（谨慎使用）
supabase db reset
supabase db push
```

## 👤 创建管理员账号

### 1. 注册普通用户账号

首先需要通过正常流程注册一个用户账号：

```bash
# 启动开发服务器
pnpm run dev
```

1. 访问 http://localhost:3000
2. 点击 "注册" 或访问 http://localhost:3000/register
3. 填写注册信息：
   - 邮箱地址
   - 密码
   - 其他必需信息
4. 完成注册并验证邮箱（如果启用了邮箱验证）

### 2. 通过 Supabase 控制台设置管理员

#### 方法1: 使用 SQL 编辑器（推荐）

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧菜单的 **"SQL Editor"**
4. 在编辑器中输入以下 SQL 命令：

```sql
-- 将指定邮箱的用户设置为管理员
SELECT public.initialize_admin('your-email@example.com');
```

将 `your-email@example.com` 替换为您刚注册的邮箱地址。

5. 点击 **"Run"** 执行 SQL
6. 如果成功，会显示 "用户 xxx 已设置为管理员" 的消息

#### 方法2: 使用 Supabase CLI

```bash
# 在项目根目录执行
supabase db shell

# 在 SQL shell 中执行
SELECT public.initialize_admin('your-email@example.com');

# 退出 shell
\q
```

### 3. 验证管理员权限

1. 重新登录应用
2. 访问管理员页面：http://localhost:3000/admin
3. 如果能正常访问管理界面，说明管理员权限设置成功

## 🧪 测试部署

### 1. 启动开发服务器

```bash
# 启动开发服务器
pnpm run dev
```

### 2. 功能测试清单

访问 http://localhost:3000 并测试以下功能：

- [ ] **用户注册和登录**
  - [ ] 邮箱注册
  - [ ] 邮箱登录
  - [ ] 用户信息显示正常

- [ ] **聊天功能**
  - [ ] 创建新对话
  - [ ] 发送消息
  - [ ] 接收回复

- [ ] **管理员功能**（使用管理员账号）
  - [ ] 访问 `/admin` 页面
  - [ ] 查看用户列表
  - [ ] API 配置管理

- [ ] **数据库连接**
  - [ ] 用户数据正常保存
  - [ ] 对话记录正常保存

### 3. 常见问题排查

#### 问题1: 环境变量未生效

```bash
# 检查环境变量是否正确加载
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 重启开发服务器
pnpm run dev
```

#### 问题2: 数据库连接失败

1. 检查 Supabase URL 和密钥是否正确
2. 确认项目在 Supabase 控制台中状态为 "Active"
3. 检查网络连接

#### 问题3: 管理员权限设置失败

```sql
-- 检查用户是否存在
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 检查用户角色
SELECT id, role FROM profiles WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- 手动设置管理员
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## 🚀 生产环境部署

### 1. 环境变量配置

在生产环境中，需要更新以下环境变量：

```ini
# 生产环境 URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 确保使用生产环境的 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# 生产环境专用的加密密钥
API_ENCRYPTION_KEY=your-production-encryption-key
```

### 2. 构建和部署

```bash
# 构建生产版本
pnpm run build

# 启动生产服务器
pnpm run start

# 或者部署到 Vercel、Netlify 等平台
```

### 3. 安全检查清单

- [ ] 所有敏感环境变量已正确配置
- [ ] `service_role` 密钥未暴露在前端代码中
- [ ] API 加密密钥已安全存储
- [ ] 数据库 RLS (Row Level Security) 策略已启用
- [ ] 管理员账号密码强度足够

## 📚 相关文档

- [环境配置要求](./SETUP-REQUIREMENTS.md) - 详细的环境配置说明
- [开发贡献指南](./CONTRIBUTING.md) - 开发环境配置
- [API 密钥管理](./README-API-KEY-MANAGEMENT.md) - API 密钥管理系统
- [数据库设计](./DATABASE-DESIGN.md) - 数据库结构说明
- [Supabase 文档](./supabase-docs.md) - Supabase 配置详情

## 🆘 获取帮助

如果在部署过程中遇到问题：

1. 检查 [常见问题排查](#3-常见问题排查) 部分
2. 查看项目的 GitHub Issues
3. 参考相关文档链接
4. 联系项目维护者

---

**祝您部署成功！** 🎉
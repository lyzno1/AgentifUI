# AgentifUI 环境配置要求

本文档详细说明从 GitHub 克隆 AgentifUI 项目开始，配置完整开发环境所需的所有工具、命令和步骤。

## 📋 必需工具清单

### 1. 基础开发工具

| 工具 | 最低版本 | 推荐版本 | 安装方式 | 验证命令 |
|------|----------|----------|----------|----------|
| **Node.js** | 18.0.0+ | 22.15.0+ | [官网下载](https://nodejs.org/) | `node --version` |
| **pnpm** | 9.0.0+ | 10.11.0+ | `npm install -g pnpm` | `pnpm --version` |
| **Git** | 2.30.0+ | 2.39.5+ | [官网下载](https://git-scm.com/) | `git --version` |

### 2. 数据库工具

| 工具 | 用途 | 安装方式 | 验证命令 |
|------|------|----------|----------|
| **Supabase CLI** | 数据库管理和迁移 | `pnpm add -g supabase` | `supabase --version` |

### 3. 可选工具

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| **VS Code** | 推荐编辑器 | [官网下载](https://code.visualstudio.com/) |
| **Docker** | 本地 Supabase 开发 | [官网下载](https://docker.com/) |

## 🚀 完整安装流程

### 步骤 1: 安装基础工具

#### 1.1 安装 Node.js
```bash
# 方式1: 从官网下载安装包
# 访问 https://nodejs.org/ 下载 LTS 版本

# 方式2: 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.15.0
nvm use 22.15.0

# 验证安装
node --version  # 应显示 v22.15.0 或更高版本
npm --version   # Node.js 自带 npm
```

#### 1.2 安装 pnpm
```bash
# 全局安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version  # 应显示 10.11.0 或更高版本
```

#### 1.3 安装 Git
```bash
# macOS (使用 Homebrew)
brew install git

# Ubuntu/Debian
sudo apt update
sudo apt install git

# Windows
# 从 https://git-scm.com/ 下载安装包

# 验证安装
git --version  # 应显示 2.30.0 或更高版本
```

### 步骤 2: 安装 Supabase CLI

```bash
# 全局安装 Supabase CLI
pnpm add -g supabase

# 验证安装
supabase --version

# 登录 Supabase (需要先注册账户)
supabase login
```

### 步骤 3: 克隆项目

```bash
# 克隆项目代码库
git clone https://github.com/ifLabX/AgentifUI.git

# 进入项目目录
cd AgentifUI

# 安装项目依赖
pnpm install
```

### 步骤 4: 验证环境

```bash
# 检查所有工具版本
echo "=== 环境检查 ==="
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Git: $(git --version)"
echo "Supabase CLI: $(supabase --version)"
echo "==================="
```

## 🔧 常见安装问题

### 问题 1: Node.js 版本过低
```bash
# 解决方案：升级 Node.js
nvm install 22.15.0
nvm use 22.15.0
nvm alias default 22.15.0
```

### 问题 2: pnpm 安装失败
```bash
# 解决方案：清理 npm 缓存后重新安装
npm cache clean --force
npm install -g pnpm@latest
```

### 问题 3: Supabase CLI 安装失败
```bash
# 方式1: 使用 npm 安装
npm install -g supabase

# 方式2: 使用官方安装脚本
curl -sSfL https://supabase.com/install.sh | sh

# 方式3: 下载二进制文件
# 访问 https://github.com/supabase/cli/releases
```

### 问题 4: Git 配置
```bash
# 首次使用需要配置用户信息
git config --global user.name "你的姓名"
git config --global user.email "你的邮箱@example.com"

# 验证配置
git config --list
```

## 📱 平台特定说明

### macOS
```bash
# 推荐使用 Homebrew 包管理器
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装开发工具
brew install node git
npm install -g pnpm supabase
```

### Ubuntu/Debian
```bash
# 更新包列表
sudo apt update

# 安装 Node.js (使用 NodeSource 仓库)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装其他工具
sudo apt install git
npm install -g pnpm supabase
```

### Windows
```powershell
# 推荐使用 Chocolatey 包管理器
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装开发工具
choco install nodejs git
npm install -g pnpm supabase
```

## ✅ 安装验证清单

完成安装后，请确认以下命令都能正常执行：

- [ ] `node --version` - 显示 Node.js 版本 (≥18.0.0)
- [ ] `pnpm --version` - 显示 pnpm 版本 (≥9.0.0)
- [ ] `git --version` - 显示 Git 版本 (≥2.30.0)
- [ ] `supabase --version` - 显示 Supabase CLI 版本
- [ ] `supabase login` - 能够登录 Supabase 账户
- [ ] `pnpm install` - 能够安装项目依赖
- [ ] `pnpm run dev` - 能够启动开发服务器

## 🔗 相关文档

- [开发贡献指南](./CONTRIBUTING.md) - 详细的开发环境配置
- [Supabase 配置文档](./supabase-docs.md) - 数据库配置说明
- [安全配置指南](./security/README.md) - 安全相关配置

---

如果在安装过程中遇到问题，请参考上述常见问题解决方案，或查看相关工具的官方文档。 
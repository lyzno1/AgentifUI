# AgentifUI 企业级智能聊天平台

## 项目简介

AgentifUI 是一个现代化的多端智能聊天平台前端，基于 Next.js App Router 架构，结合 Supabase Auth、Dify API、Zustand 状态管理和分层数据服务，致力于为企业提供安全、可扩展、易维护的 LLM 聊天体验。

本项目注重工程规范、数据一致性、性能优化与用户体验，适用于企业知识库、AI 助手等场景。

## 主要功能

- 多端响应式聊天 UI，支持移动与桌面
- 支持多应用/多对话管理
- 消息持久化与断点恢复
- Dify API 集成（支持流式回复）
- Supabase 用户认证与权限管理
- API 密钥安全管理与加密
- 高性能消息分页与缓存
- 主题切换与无障碍支持
- 健壮的错误处理与状态同步

## 技术栈

- **前端框架**：Next.js 15 (App Router)
- **UI**：React 18, Tailwind CSS 4
- **状态管理**：Zustand
- **后端服务**：Supabase (Auth + Database)
- **API集成**：Dify, OpenAI 等
- **工具库**：clsx/cn, Lucide Icons, lodash, date-fns
- **类型系统**：TypeScript

## 架构设计

采用分层架构，关注点分离：

```
UI组件 (React)
    ↓
自定义Hooks (use-*)
    ↓
数据库操作 (lib/db/*)
    ↓
数据服务 (lib/services/*)
    ↓
Supabase Client
```

## 核心亮点

- **安全**：严格依赖数据库对话ID，避免临时状态写入，确保数据一致性
- **可维护**：支持临时ID、Dify ID、数据库ID三者转换，流程健壮
- **易集成**：API密钥安全体系，支持加密存储、分用户/实例管理、回退机制
- **数据主权**：严格类型约束，前后端类型同步，行级安全策略（RLS）保障数据隔离
---

## 快速开始

> 📋 **完整环境配置**: 请先查看 [环境配置要求文档](./docs/SETUP-REQUIREMENTS.md) 了解所需工具和详细安装步骤

1. 安装依赖

```bash
pnpm install
```

2. 配置环境变量（参考 `.env.local.example`）

3. 启动开发服务器

```bash
pnpm run dev
```

4. 访问 http://localhost:3000

---

## 主要目录说明

- `app/`           Next.js 路由与页面
- `components/`    通用与业务组件
- `lib/`           数据、服务、hooks、状态管理
- `docs/`          架构、数据库和API密钥设计文档
- `supabase/`      数据库迁移文件

## 交流与支持

如有问题或建议，请通过 issue 或 PR 与我们联系。

---


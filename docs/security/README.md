# 🔒 安全

我们高度重视系统安全，建立了完善的安全体系：

## 安全状态
```
🔒 安全级别：高
📊 数据库安全：✅ ERROR级别问题已全部解决
⚠️ 待优化项：12个 WARNING 级别建议
🎯 总体评价：系统安全，可正常使用
```

## 安全文档
- [🔍 数据库安全审计](./database-security-audit.md) - Supabase 安全问题修复指南
- [📋 安全检查清单](./security-checklist.md) - 日常安全检查流程
- [💻 代码安全规范](./code-security-guidelines.md) - 开发安全最佳实践
- [🚨 事件响应指南](./incident-response.md) - 安全事件处理流程

## 安全特性
- **数据库安全**：启用 RLS（行级安全），严格权限控制
- **认证安全**：Supabase Auth，支持邮箱验证、密码强度检查
- **API安全**：密钥加密存储，访问权限控制
- **前端安全**：XSS防护，CSRF防护，输入验证
- **依赖安全**：定期安全审计，及时更新漏洞包

## 自动化安全检查
项目配置了 GitHub Actions 自动安全检查工作流：
- **依赖扫描**：每日自动检查pnpm包漏洞
- **代码安全**：ESLint安全规则检查
- **环境检查**：防止敏感信息泄露
- **Supabase安全**：数据库迁移安全验证

## 快速安全检查
```bash
# 运行安全检查
pnpm audit
supabase db lint --level error

# 手动触发GitHub Actions安全检查
gh workflow run security.yml
```

---

遵循这些安全规范和流程，确保系统持续安全运行。

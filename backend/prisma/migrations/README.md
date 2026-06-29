# Prisma Migrations

按时间顺序执行，每个目录必须包含 `migration.sql`。

| 目录 | 说明 |
|------|------|
| `20250626000000_init` | 初始表结构 |
| `20250626120000_business_extensions` | 采购申请、报价、应收应付 |
| `20250626140000_extended_modules` | 固定资产、盘点、售后、集成 |
| `20250626160000_audit_logs` | 审计日志 |
| `20250626180000_tenant_budget_queue` | 多租户、预算、通知、序列号 |
| `20250626200000_file_assets` | 文件资产（MinIO/OSS） |

## 应用迁移

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

## 校验脚本

```powershell
# Windows
.\scripts\verify-migrations.ps1

# Linux/macOS
./scripts/verify-migrations.sh
```

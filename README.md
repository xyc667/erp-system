# ERP 企业资源计划系统

基于 **NestJS + React + PostgreSQL** 的全栈 ERP，覆盖采购、销售、库存、生产、财务、人力、项目、报表与系统管理等模块。支持多租户、RBAC 权限、Redis 缓存、MinIO 文件存储、WebSocket 通知、区块链库存追溯锚点及中英文界面。

## 功能概览

| 模块 | 能力 |
|------|------|
| 采购 | 供应商、采购申请、采购订单、收货验收 |
| 销售 | 客户、报价、销售订单、发货、售后 |
| 库存 | 台账、出入库、调拨、盘点、批次追溯 |
| 生产 | BOM、计划、工单、质检 |
| 财务 | 总账、应收应付、固定资产、预算、报表 |
| 人力 | 员工、部门、岗位、考勤、薪资 |
| 报表 | 运营看板、BI 大屏、智能补货分析 |
| 系统 | 用户、角色、权限、租户、审计、文件 |

## 环境要求

- Node.js >= 18
- PostgreSQL >= 16（或 Docker Compose 一键启动）

## 快速开始

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # 可选，开发模式可走 Vite 代理
```

编辑 `backend/.env`：设置 `DATABASE_URL`、`JWT_SECRET`，以及 seed 用的演示账号密码（**生产环境务必修改**）。

### 3. 初始化数据库

**Windows：**

```powershell
.\scripts\init-db.ps1
```

**Linux / macOS：**

```bash
chmod +x scripts/init-db.sh && ./scripts/init-db.sh
```

或手动：

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed
```

seed 完成后，控制台会输出已创建的管理员与演示用户名；密码以你在 `.env` 中配置的 `SEED_ADMIN_PASSWORD` / `SEED_DEMO_PASSWORD` 为准。

### 4. 启动开发服务

```bash
# 终端 1 — 后端 API（默认 http://localhost:3000）
npm run start:backend

# 终端 2 — 前端（默认 http://localhost:5173）
npm run start:frontend
```

开发环境 Swagger 文档：http://localhost:3000/api

## Docker 部署

```bash
npm run docker:up
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:8080 |
| 后端 API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)（含 Kubernetes、Redis、MinIO、性能测试说明）。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | 业务流程与 FAQ |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | 详细使用说明（含截图） |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 部署指南 |

本地生成 PDF：`npm run docs:pdf` → `docs/USER_MANUAL.pdf`

## 测试

```bash
npm test                  # 前后端单元测试
npm run verify:migrations # 校验迁移文件
npm run test:e2e          # Playwright 端到端（需先 test:e2e:install）
npm run test:perf         # 性能冒烟（需后端运行中）
```

## 项目结构

```
erp/
├── backend/          # NestJS API + Prisma
├── frontend/         # React + Vite + Ant Design
├── docker/           # Docker Compose
├── k8s/              # Kubernetes 清单
├── docs/             # 用户与部署文档
├── e2e/              # Playwright 测试
├── scripts/          # 数据库初始化、PDF 导出
└── .github/workflows # CI 流水线
```

## 权限模型

- **后端**：`@RequirePermissions` + `PermissionsGuard`
- **前端**：侧栏菜单过滤 + 
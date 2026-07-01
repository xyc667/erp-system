# ERP 企业资源计划系统

基于 **NestJS + React + PostgreSQL** 的全栈 ERP，覆盖采购、销售、库存、生产、财务、人力、项目、报表与系统管理等模块；配套 **外勤移动端**（`mobile-field`，Expo / React Native）。支持多租户、RBAC 权限、Redis 缓存、MinIO 文件存储、WebSocket 通知、区块链库存追溯锚点及中英文界面。

## 功能概览

| 模块 | 能力 |
|------|------|
| 采购 | 供应商、采购申请、采购订单、收货验收 |
| 销售 | 客户、报价、销售订单、发货、售后、公海线索、联系上报与审核 |
| 库存 | 台账、出入库、调拨、盘点、批次追溯 |
| 生产 | BOM、计划、工单、质检 |
| 财务 | 总账、应收应付、固定资产、预算、报表 |
| 人力 | 员工、部门、岗位、考勤、薪资 |
| 报表 | 运营看板、BI 大屏、智能补货分析 |
| 系统 | 用户、角色、权限、租户、审计、文件 |
| **外勤 App** | 公海领取（含批量）、联系上报、录音上传、上报审核、消息、地图导航、离线上报、版本更新 |

## 外勤 App（Android / iOS）

面向销售外勤的移动端，与 Web ERP **共用账号与后端 API**。

| 平台 | 当前版本 | 获取方式 |
|------|----------|----------|
| **Android** | v1.1.1（versionCode 5） | [下载 APK](https://github.com/xyc667/erp-system/raw/master/backend/public/apk/erp-field-latest.apk) |
| **iOS** | 内测版 | TestFlight（见 [iOS 部署方案](docs/FIELD_APP_IOS_SETUP.md)） |

**Android 安装：** 下载 APK 后安装；若提示签名冲突，先卸载旧版。租户编码默认 `default`，演示账号见 seed 配置。

**自行构建 APK（Windows）：**

```bash
cd mobile-field
cp .env.example .env    # 设置 EXPO_PUBLIC_API_URL 为你的后端地址
npm run build:apk
# 产物复制到 backend/public/apk/erp-field-latest.apk
```

**开发联调：**

```bash
npm run start:backend          # 项目根目录，需配置 backend/.env
cd mobile-field && npm run android
```

| 文档 | 说明 |
|------|------|
| [docs/FIELD_APP_USER_GUIDE.md](docs/FIELD_APP_USER_GUIDE.md) | 安装、操作、FAQ |
| [mobile-field/README.md](mobile-field/README.md) | 开发者构建与联调 |
| [docs/FIELD_APP_IOS_SETUP.md](docs/FIELD_APP_IOS_SETUP.md) | EAS 云构建 + TestFlight |
| [docs/CLOUD_DEPLOYMENT.md](docs/CLOUD_DEPLOYMENT.md) | 上云后外勤 App 配置 |

版本检查接口（无需登录）：`GET /api/app/field-android/latest`、`GET /api/app/field-ios/latest`

## 界面预览

### 登录页

<img src="docs/images/erp-login.png" alt="登录页" width="720">

### 数据看板

<img src="docs/images/erp-dashboard.png" alt="数据看板" width="720">

### BI 大屏

<img src="docs/images/erp-bi-screen.png" alt="BI 大屏" width="720">

### 采购管理

<img src="docs/images/erp-procurement.png" alt="采购管理" width="720">

### 智能分析

<img src="docs/images/erp-intelligence.png" alt="智能分析中心" width="720">

### 角色与权限

<img src="docs/images/erp-role-management.png" alt="角色管理" width="720">

### 公海线索与联系上报

<img src="docs/images/erp-leads-pool.png" alt="公海线索" width="720">

<img src="docs/images/erp-leads-contact-report.png" alt="联系上报" width="720">

<img src="docs/images/erp-leads-reports-pending.png" alt="上报审核" width="720">

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
# 终端 1 — 后端 API（默认 http://localhost:3000，可在 backend/.env 改 PORT）
npm run start:backend

# 终端 2 — 前端（默认 http://localhost:5173）
npm run start:frontend
```

开发环境 Swagger 文档：http://localhost:3000/api

常用脚本：

| 命令 | 说明 |
|------|------|
| `npm run build:field-apk` | 构建外勤 Android Release APK |
| `npm run docs:pdf` | 导出 Web / 外勤使用说明 PDF |
| `npm run docs:verify:field-version` | 冒烟测试 App 版本接口 |

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
**云服务器生产部署：** [docs/CLOUD_DEPLOYMENT.md](docs/CLOUD_DEPLOYMENT.md)

## 文档

| 文档 | 说明 |
|------|------|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | 业务流程与 FAQ |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | 详细使用说明（含财务、公海线索等分模块步骤与 FAQ） |
| [docs/FIELD_APP_USER_GUIDE.md](docs/FIELD_APP_USER_GUIDE.md) | **外勤 App**（Android / iOS）安装与操作说明 |
| [docs/FIELD_APP_IOS_SETUP.md](docs/FIELD_APP_IOS_SETUP.md) | **外勤 iOS 部署方案**（EAS + TestFlight + 云 API） |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 部署指南（Docker / K8s） |
| [docs/CLOUD_DEPLOYMENT.md](docs/CLOUD_DEPLOYMENT.md) | **云服务器生产部署**（HTTPS、外勤 App） |

本地生成 PDF：`npm run docs:pdf` → `docs/USER_MANUAL.pdf` + `docs/FIELD_APP_USER_GUIDE.pdf`

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
├── mobile-field/     # 外勤 App（Expo / React Native，Android + iOS）
├── docker/           # Docker Compose（含生产 compose）
├── k8s/              # Kubernetes 清单
├── docs/             # 用户、外勤、部署文档
├── e2e/              # Playwright 测试
├── scripts/          # 数据库初始化、PDF 导出、手册截图
└── .github/workflows # CI 流水线
```

> APK 文件位于 `backend/public/apk/erp-field-latest.apk`（Git LFS）。`.env`、keystore、公海 POI 数据 **不纳入仓库**。

## 权限模型

- **后端**：`@RequirePermissions` + `PermissionsGuard`
- **前端**：侧栏菜单过滤 + 路由级 `PermissionRoute`（403 页）

## 声明
  禁止商业用途！！！
## 许可证

MIT

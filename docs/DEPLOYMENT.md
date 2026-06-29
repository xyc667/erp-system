# 部署指南

## Docker Compose（推荐开发/测试）

```bash
npm run docker:up
```

服务：

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:8080 |
| 后端 API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| RabbitMQ | localhost:5672（管理台 15672） |
| MinIO | localhost:9000（控制台 9001，默认 minioadmin/minioadmin） |

首次启动会自动执行数据库迁移和种子数据。

### 数据库迁移

仓库内共 6 个迁移目录，每个均含 `migration.sql`。部署前可校验：

```bash
npm run verify:migrations
npm run init:db
```

详见 `backend/prisma/migrations/README.md`。

## Kubernetes

### 前置条件

- kubectl 已配置
- 集群已安装 NGINX Ingress Controller
- 本地已构建镜像 `erp-backend:latest` 和 `erp-frontend:latest`

```bash
# 构建镜像
docker compose -f docker/docker-compose.yml build

# 标记镜像（按需推送到私有仓库）
docker tag docker-backend erp-backend:latest
docker tag docker-frontend erp-frontend:latest
```

### 部署

```bash
# 1. 复制并修改密钥
cp k8s/secrets.example.yaml k8s/secrets.yaml
# 编辑 JWT_SECRET 等敏感配置

# 2. 应用清单
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# 等待 PostgreSQL 就绪后初始化数据库（一次性 Job 或手动 exec）
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# 或使用 kustomize（需先将 secrets.example 改为 secrets.yaml 并更新 kustomization）
kubectl apply -k k8s/
```

### 访问

在 `/etc/hosts` 添加：

```
127.0.0.1 erp.local
```

浏览器访问 http://erp.local

### 扩缩容

```bash
kubectl scale deployment backend -n erp --replicas=3
kubectl scale deployment frontend -n erp --replicas=3
```

## Redis 缓存

设置环境变量 `REDIS_URL` 后，报表/看板数据将缓存至 Redis：

- 运营概览：60 秒 TTL
- 财务报表：120 秒 TTL

未配置 Redis 时自动降级为进程内内存缓存。

健康检查 `GET /api/health` 会返回 Redis 连接状态。

## MinIO 文件存储

Docker Compose 已包含 MinIO。后端环境变量（见 `backend/.env.example`）：

| 变量 | 说明 |
|------|------|
| `MINIO_ENDPOINT` | 主机名，Compose 内为 `minio` |
| `MINIO_PORT` | 默认 9000 |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | 凭据 |
| `MINIO_BUCKET` | 默认 `erp-files` |

未配置 `MINIO_ENDPOINT` 时文件元数据仍入库，但对象不上传。前端入口：**系统管理 → 文件中心**（`/system/files`）。

## WebSocket 实时通知

- 命名空间：`/ws`（Socket.IO）
- 连接时通过 `auth.token` 或 `Authorization: Bearer` 传递 JWT
- 事件：`notification`（新通知推送）、`ping`/`pong`

开发模式下 Vite 已代理 `/socket.io` 至后端。

## 性能测试

```bash
# 后端运行中
npm run test:perf

# k6 压力测试（需安装 k6）
k6 run tests/perf/k6-load.js
```

详见 `tests/perf/README.md`。

## 国际化与移动端

- 登录页右上角可切换 **中文 / English**（`frontend/src/i18n/`）
- 布局在窄屏下自动切换为 Drawer 侧栏（`Grid.useBreakpoint`）
- BI 大屏：`/bi-screen`（全屏深色主题，30 秒自动刷新）
- 语言切换：登录页右上角 **或** Header 右侧（中文 / English）
- 侧栏、面包屑、403/404 页面已支持双语；业务页面内容仍以中文为主

## 生产检查清单

- [ ] 修改 `JWT_SECRET` 和数据库密码
- [ ] 设置 `RUN_SEED=false`（生产环境勿重复 seed）
- [ ] 配置 HTTPS（Ingress TLS 证书）
- [ ] 配置数据库备份策略
- [ ] 配置日志与监控（Prometheus/Grafana）

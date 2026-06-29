# Performance Testing

## 快速冒烟（Node，无需额外安装）

```bash
# 健康检查 only
node tests/perf/load-smoke.mjs

# 登录 + 库存/采购/销售读 API 轮询
SCENARIO=full node tests/perf/load-smoke.mjs
npm run test:perf:full

# Windows PowerShell
$env:SCENARIO="full"; node tests/perf/load-smoke.mjs

# 自定义参数
$env:API_BASE="http://localhost:3000"; $env:CONCURRENCY=50; node tests/perf/load-smoke.mjs
```

## k6 压力测试

安装 [k6](https://k6.io/docs/get-started/installation/) 后：

```bash
# 完整压测（本地）— 含库存/采购/销售等读 API
k6 run tests/perf/k6-load.js

# CI 轻量 profile（并行子集）
k6 run tests/perf/k6-ci.js

# 指定 API
k6 run -e API_BASE=http://localhost:3000 tests/perf/k6-load.js
```

### 覆盖的读 API（`tests/perf/lib/scenarios.js`）

| 分组 | 端点 |
|------|------|
| report | `GET /api/dashboard/stats` |
| inventory | `GET /api/inventory/stock`, `/movements`, `/alerts`, `/products` |
| procurement | `GET /api/procurement/requests`, `/orders`, `/vendors` |
| sales | `GET /api/sales/orders` |
| system | `GET /api/notifications` |

默认账号通过环境变量配置：`PERF_TENANT`（默认 `default`）、`PERF_USER`（默认 `admin`）、`PERF_PASSWORD`（默认与 `SEED_ADMIN_PASSWORD` 一致，见 `backend/.env.example`）。

| 脚本 | 场景 | 阈值 |
|------|------|------|
| `k6-load.js` | 20→50 VU 阶梯，顺序调用全部读 API | P95 < 800ms，失败率 < 5% |
| `k6-ci.js` | 10 VU × 30s，并行调用 6 个核心 API | P95 < 1500ms，失败率 < 10% |

共享场景逻辑：`tests/perf/lib/scenarios.js`

## CI

GitHub Actions `perf` job：

1. PostgreSQL + migrate + seed
2. 启动 `npm run start:prod`
3. 运行 `k6 run tests/perf/k6-ci.js`

本地复现 CI 步骤：

```bash
cd backend
npx prisma migrate deploy && npx prisma db seed
npm run build && npm run start:prod
# 另一终端
k6 run tests/perf/k6-ci.js
```

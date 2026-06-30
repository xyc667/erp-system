# 沈阳公海线索模块 PRD（方案甲 · POI 为主）

> 版本：v0.1 · 状态：已确认首期范围  
> 适用：ERP 销售模块 · 沈阳线下门店扫街

---

## 1. 背景与目标

### 1.1 背景

销售团队需要大量**有电话、可拜访**的沈阳线下门店线索。工商数据缺电话，地图 POI 更适合「扫街销售」场景。线索需与正式客户分离，采用 CRM **公海**模式管理。

### 1.2 目标

| 目标 | 说明 |
|------|------|
| 快速可用 | 第一期即有电话、可按区/行业筛选 |
| 不污染主数据 | 公海与 `customers` 分表，转化后才进正式客户 |
| 可持续 | 支持 POI 导入、销售反馈洗数据、定期增量更新 |
| 可分配 | 领取、保护期、自动回收，避免囤积 |

### 1.3 非目标（第一期不做）

- 沈阳工商主体全覆盖
- 电话空号自动检测（无免费可靠源）
- 对外销售/转售 POI 数据
- 自动外呼、短信群发

---

## 2. 首期范围（已确认）

### 2.1 地域

| 阶段 | 区域 |
|------|------|
| **第一期试点** | 铁西区、和平区 |
| **第二期** | 沈阳其余 11 个区县 |

### 2.2 行业（第一期）

1. **餐饮**
2. **美容美发**
3. **五金建材**

### 2.3 数据量目标

- 去重后有效线索：**3,000～5,000** 条
- 周期：**2 周** 数据入库 + **1 周** 流程试跑

### 2.4 公海规则（已确认）

| 规则 | 值 |
|------|-----|
| 每人同时持有上限 | **50** 条 |
| 保护期 | **14** 天 |
| 保护期内无跟进 | 到期**自动回公海** |
| 无效线索 | 销售可标记，不再默认分配 |

---

## 3. 用户与权限

### 3.1 角色

| 角色 | 能力 |
|------|------|
| 销售专员 | 浏览公海、领取/释放、跟进、标记无效、转客户 |
| 销售主管 | 以上 + 查看团队统计、批量释放 |
| 系统管理员 | 以上 + POI 导入、合并重复、规则配置 |

### 3.2 权限码（建议）

| 权限码 | 说明 |
|--------|------|
| `lead:view` | 查看公海列表 |
| `lead:claim` | 领取、释放自己的线索 |
| `lead:follow` | 写跟进记录 |
| `lead:convert` | 转为正式客户 |
| `lead:invalidate` | 标记无效 |
| `lead:import` | POI 批量导入（管理员） |
| `lead:manage` | 合并重复、强制回收、规则配置 |

---

## 4. 数据模型

### 4.1 表：`lead_pool`（公海线索）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | UUID | 是 | 主键 |
| `tenant_id` | UUID | 是 | 租户 |
| `name` | string | 是 | POI 店名 |
| `phone` | string | 否 | 主电话 |
| `phone_backup` | string | 否 | 备用电话 |
| `address` | string | 否 | 详细地址 |
| `district` | string | 否 | 区县（和平/铁西…） |
| `category` | string | 否 | 行业分类（餐饮/美容美发/五金建材） |
| `poi_category_raw` | string | 否 | 地图原始分类 |
| `lng` | decimal | 否 | 经度 |
| `lat` | decimal | 否 | 纬度 |
| `source` | enum | 是 | `amap` / `tencent` / `manual` |
| `source_id` | string | 否 | 外部 POI ID |
| `status` | enum | 是 | 见 4.2 |
| `quality` | enum | 是 | 见 4.3 |
| `owner_user_id` | UUID | 否 | 当前领取人 |
| `claimed_at` | datetime | 否 | 领取时间 |
| `expire_at` | datetime | 否 | 保护期截止时间 |
| `follow_up_count` | int | 是 | 跟进次数，默认 0 |
| `last_follow_at` | datetime | 否 | 最后跟进时间 |
| `dedup_key` | string | 是 | 去重键 |
| `converted_customer_id` | UUID | 否 | 转化后的客户 ID |
| `converted_at` | datetime | 否 | 转化时间 |
| `invalid_reason` | string | 否 | 无效原因 |
| `remark` | text | 否 | 备注 |
| `created_at` | datetime | 是 | |
| `updated_at` | datetime | 是 | |

**索引建议：**

- `(tenant_id, status, district, category)`
- `(tenant_id, owner_user_id, status)`
- `(tenant_id, dedup_key)` UNIQUE
- `(tenant_id, source, source_id)` UNIQUE（source_id 非空时）

### 4.2 线索状态 `status`

| 值 | 说明 |
|----|------|
| `pool` | 在公海，可领取 |
| `claimed` | 已领取，保护期内 |
| `converted` | 已转正式客户 |
| `invalid` | 无效（空号/关店/非目标） |

### 4.3 质量标记 `quality`

| 值 | 说明 |
|----|------|
| `unknown` | 未核实（默认） |
| `valid` | 有效，可继续跟进 |
| `empty_phone` | 空号 |
| `closed` | 已关店 |
| `not_target` | 非目标行业 |

### 4.4 表：`lead_follow_ups`（跟进记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `lead_id` | UUID | 关联线索 |
| `user_id` | UUID | 跟进人 |
| `type` | enum | `call` / `visit` / `wechat` / `other` |
| `content` | text | 跟进内容 |
| `next_action_at` | datetime | 下次计划跟进 |
| `created_at` | datetime | |

### 4.5 去重规则

1. **强去重**：`source + source_id` 相同 → 跳过导入  
2. **弱去重**：`normalize(name) + phone` 相同 → 进「待合并」或更新 `phone_backup`  
3. **疑似重复**：同 `district`、地址相似、店名相似 → 管理员人工合并  

`dedup_key` 生成建议：`sha256(normalize(name) + phone + district)`

---

## 5. 业务流程

### 5.1 领取

```
销售在公海列表筛选 → 点击「领取」
  → 校验：当前持有 < 50
  → status: pool → claimed
  → 写入 owner_user_id, claimed_at, expire_at = now + 14天
```

### 5.2 跟进

```
销售在「我的线索」写跟进
  → 插入 lead_follow_ups
  → follow_up_count + 1, last_follow_at = now
  → （可选）延长保护期：expire_at = now + 14天
```

> 第一期建议：**有跟进则重置保护期**，避免积极跟进的线索被回收。

### 5.3 自动回收（定时任务）

```
每日凌晨扫描：
  status = claimed
  AND expire_at < now
  AND last_follow_at 为空 OR last_follow_at < claimed_at（保护期内无有效跟进）
  → status: pool, 清空 owner_user_id / claimed_at / expire_at
```

### 5.4 转客户

```
销售点击「转为客户」
  → 填写/确认：客户名、联系人、电话、地址
  → 创建 customers 记录
  → lead.status = converted, converted_customer_id, converted_at
  → 公海列表不再展示（或仅管理员可查历史）
```

### 5.5 标记无效

```
销售选择原因：空号 / 已关店 / 非目标
  → status = invalid, quality 对应更新, invalid_reason
  → 若已领取，释放归属
```

---

## 6. 页面清单

### 6.1 菜单结构

```
销售管理
  ├── 公海线索        /sales/leads/pool
  ├── 我的线索        /sales/leads/mine
  └── 线索统计（主管） /sales/leads/stats
```

系统管理（管理员）

```
  └── 线索导入        /system/leads/import
```

### 6.2 公海线索页 `/sales/leads/pool`

| 区域 | 内容 |
|------|------|
| 筛选 | 区县、行业、有无电话、质量、关键词（店名/电话/地址） |
| 列表 | 店名、电话、地址、区县、行业、来源、入库时间 |
| 操作 | 领取（单条/批量，批量上限 10）、查看地图 |
| 提示 | 当前已持有 x/50 |

### 6.3 我的线索页 `/sales/leads/mine`

| 区域 | 内容 |
|------|------|
| Tab | 跟进中 / 即将到期（3天内） |
| 列表 | 店名、电话、保护期剩余天数、最后跟进、跟进次数 |
| 操作 | 跟进、导航、转客户、标记无效、释放 |
| 侧栏/抽屉 | 跟进记录时间线 |

### 6.4 跟进抽屉

- 跟进方式、内容、下次跟进时间  
- 快捷标记：有效 / 空号 / 关店  

### 6.5 转客户弹窗

- 预填：店名 → 客户名、电话、地址  
- 可编辑后提交  
- 成功后跳转客户详情（可选）  

### 6.6 线索统计页 `/sales/leads/stats`（主管）

| 指标 | 说明 |
|------|------|
| 公海剩余 | 按区/行业分布 |
| 领取/转化 | 每人本周领取数、转化数、转化率 |
| 无效率 | 空号/关店占比 |
| 到期回收 | 本周自动回公海数量 |

### 6.7 线索导入页 `/system/leads/import`（管理员）

- 上传 CSV / 执行 POI 同步任务  
- 字段映射：name, phone, address, district, category, lng, lat, source, source_id  
- 导入结果：新增 / 跳过重复 / 失败行  

---

## 7. API 概要（后端）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/leads/pool` | 公海列表（分页、筛选） |
| GET | `/api/leads/mine` | 我的线索 |
| POST | `/api/leads/:id/claim` | 领取 |
| POST | `/api/leads/claim-batch` | 批量领取 |
| POST | `/api/leads/:id/release` | 释放 |
| POST | `/api/leads/:id/follow-ups` | 写跟进 |
| GET | `/api/leads/:id/follow-ups` | 跟进列表 |
| POST | `/api/leads/:id/convert` | 转客户 |
| POST | `/api/leads/:id/invalidate` | 标记无效 |
| POST | `/api/leads/import` | 批量导入 |
| GET | `/api/leads/stats` | 统计数据 |
| GET | `/api/leads/quota` | 当前持有数/上限 |

---

## 8. POI 数据采集（第一期）

### 8.1 来源

- 主：**高德地图 Place API**
- 备：**腾讯位置服务**（可选，用于补漏）

### 8.2 采集参数

| 参数 | 值 |
|------|-----|
| 城市 | 沈阳市 |
| 区县 | 铁西区、和平区 |
| 关键词/类型 | 餐饮、美容、美发、五金、建材 |
| 字段 | name, tel, address, adname, type, location, id |

### 8.3 导入节奏

- 脚本按「区 × 行业 × 分页」运行，遵守 API 日限额  
- 导入时打 `source=amap`, `quality=unknown`, `status=pool`  
- 首期目标 **3,000～5,000** 去重条  

### 8.4 CSV 模板（手工/脚本导出用）

```csv
name,phone,phone_backup,address,district,category,lng,lat,source,source_id
示例餐饮店,024-12345678,,XX路XX号,铁西区,餐饮,123.45,41.80,amap,B0XXXX
```

---

## 9. 成功标准（第一期）

| 指标 | 目标 |
|------|------|
| 入库线索 | ≥ 3,000 条（铁西+和平，三行业） |
| 有电话比例 | ≥ 60% |
| 销售试用 | ≥ 3 人使用「领取+跟进」 |
| 转化 | 试点期内 ≥ 30 条转正式客户 |
| 空号反馈 | 可标记并统计，无效率可观测 |

---

## 10. 第二期展望

- 扩区：沈阳全市 13 区县  
- 扩行业：汽修、教培、药店、超市等  
- 地图展示：公海热力图  
- 工商抽检：高价值线索补信用代码  
- 与现有 `sales:customer` 权限体系深度整合  

---

## 11. 风险与对策

| 风险 | 对策 |
|------|------|
| POI 电话不准 | 销售标记无效 + 统计空号率 |
| API 限额 | 分天采集、优先核心行业 |
| 重复 POI | dedup_key + 管理员合并 |
| 线索囤积 | 50 上限 + 14 天回收 |
| 数据合规 | 仅内部 CRM，不对外售卖 |

---

## 附录：沈阳区县编码（导入用）

| 区县 |
|------|
| 和平区、沈河区、大东区、皇姑区、铁西区 |
| 苏家屯区、浑南区、沈北新区、于洪区 |
| 辽中区、新民市、康平县、法库县 |

---

*文档确认：行业=餐饮/美容美发/五金建材 · 持有上限=50 · 保护期=14天 · 试点=铁西+和平*

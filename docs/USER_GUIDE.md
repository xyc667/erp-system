# ERP 系统用户指南

> **完整版说明请参阅：[详细使用说明 (USER_MANUAL.md)](USER_MANUAL.md)**（含截图、分模块操作步骤、演示账号与权限说明）  
> **外勤 App：** [外勤 App 使用说明 (FIELD_APP_USER_GUIDE.md)](FIELD_APP_USER_GUIDE.md)  
> PDF 版本：在项目根目录执行 `npm run docs:pdf` 生成 `docs/USER_MANUAL.pdf` 与 `docs/FIELD_APP_USER_GUIDE.pdf`

## 登录

- 地址：开发环境 http://localhost:5173，Docker http://localhost:8080
- 首次部署后执行 `npm run seed`，使用 `.env` 中配置的 `SEED_ADMIN_PASSWORD` 登录管理员账号 `admin`

## 核心业务流程

### 采购流程

1. **采购申请** → 创建并提交审批
2. **转采购单** → 审批通过后选择供应商生成采购订单
3. **审批采购订单** → 草稿订单审批
4. **收货入库** → 选择仓库完成收货
5. **应付管理** → 自动生成应付单，登记付款

**智能补货快捷路径：** 报表中心 → 智能分析 → 智能补货 → 转采购申请 → 后续同上。

![智能补货](images/erp-intelligence-replenishment.png)

![采购申请](images/erp-procurement.png)

![采购订单与收货](images/erp-procurement-order.png)

### 销售流程

1. **公海线索** → 筛选沈阳 POI 商户 → **领取** 至我的线索（上限 50 条；Web / **外勤 App** 均支持 **批量领取**）
2. **联系上报** → 填写跟进方式、联系结果、摘要（可选 **上传手机内录音**）→ 提交待审
3. **上报审核**（销售总监/管理员）→ 通过或驳回 → 查看联系统计（Web）；App 可审核与收消息
4. **销售报价** → 创建报价单并审批
5. **转销售单** → 生成销售订单
6. **审批并发货** → 审批后选择仓库发货（扣减库存）
7. **应收管理** → 自动生成应收单，登记收款
8. **售后服务** → 创建售后工单并跟踪处理

![公海线索](images/erp-leads-pool.png)

![联系上报](images/erp-leads-contact-report.png)

![上报审核](images/erp-leads-reports-pending.png)

### 外勤 Android App

销售外勤可使用 **ERP 外勤 App**（Android APK）完成公海领取、联系上报、导航到店、消息通知等；报价/订单/发货仍在 Web 操作。

| 项目 | 说明 |
|------|------|
| 安装 | `http://<服务器IP>:3001/apk/erp-field-latest.apk` |
| 演示账号 | 租户 `default`，销售 `sales_clerk`，主管 `sales_director` |
| 完整说明 | **[外勤 App 使用说明](FIELD_APP_USER_GUIDE.md)** |

### 库存管理

路径：**库存管理**（需 `inventory:*` 权限；演示账号 `warehouse_admin`）

| 功能 | 说明 |
|------|------|
| 库存台账 | 各仓当前数量（含批次） |
| 出入库 | 手工调整与流水查询 |
| 库存调拨 | 仓间转移 |
| 库存盘点 | 账实核对，完成自动调整 |
| 库存预警 | 低于安全库存的产品 |
| 批次追溯 | 批次/序列号全链路 |
| 产品 / 仓库 | 主数据与安全库存 |

完整步骤与演练顺序见 **[详细使用说明 第 8 章](USER_MANUAL.md#8-库存管理)**。

![库存台账](images/erp-inventory-stock.png)

![出入库管理](images/erp-inventory-inout.png)

![库存调拨](images/erp-inventory-transfer.png)

![库存盘点](images/erp-inventory-stocktake.png)

![库存预警](images/erp-inventory-alert.png)

![批次追溯](images/erp-inventory-trace-batch.png)

**推荐演练：** 台账查看 → 库存调整 +10 → 调拨至副仓 → 新建盘点并完成 → 提高安全库存看预警 → 批次号查询追溯。

重新生成库存截图：`npm run docs:screenshots:inventory`；全流程截图：`npm run docs:screenshots`。

### 生产流程

1. **BOM 管理** → 维护成品与组件用量（展开行查看明细）
2. **生产计划** → 新建并 **审批**
3. **工单管理** → 新建 → **下达** → **开工**（扣组件库存）→ **完工入库**（增成品库存）
4. **质量管理** → 对进行中/已完工工单登记检验结果

完整步骤见 **[详细使用说明 第 9 章](USER_MANUAL.md#9-生产管理)**。

![BOM 管理](images/erp-production-bom.png)

![生产计划](images/erp-production-plan.png)

![工单管理](images/erp-production-work-order.png)

![质量管理](images/erp-production-quality.png)

### 财务模块

路径：**财务管理**（需对应 `finance:*` 权限）

#### 业务联动

| 步骤 | 业务部门操作 | 财务结果 |
|------|--------------|----------|
| 1 | 销售订单 **审批 → 发货** | 自动生成 **应收单** |
| 2 | 财务管理 → 应收管理 → **收款** | 更新已收/未收；报表「应收未收」变化 |
| 3 | 采购订单 **审批 → 收货** | 自动生成 **应付单** |
| 4 | 财务管理 → 应付管理 → **付款** | 更新已付/未付；报表「应付未付」变化 |

#### 子模块说明

- **总账管理**（`finance:gl`）：维护科目；录入凭证并 **过账**，影响报表科目余额表。
- **应收 / 应付**（`finance:ar` / `finance:ap`）：由业务单据自动生成，支持部分/全额收付款；状态 `open` → `partial` → `paid`。
- **固定资产**（`finance:asset`）：资产卡片、计提折旧、处置；变更后刷新财务报表固定资产净值。
- **预算管理**（`finance:budget`）：按年度/部门设预算；采购订单审批时校验并扣减额度，超预算拒绝审批。
- **财务报表**（`finance:report`）：应收未收、应付未付、固定资产净值、科目余额表；收付款后 **刷新页面** 即可见最新汇总。

完整步骤与演练顺序见 **[详细使用说明 第 10 章](USER_MANUAL.md#10-财务管理)**。

![应收管理](images/erp-finance-ar.png)

![应付管理 — 登记付款](images/erp-finance-ap.png)

![登记付款弹窗](images/erp-finance-ap-payment.png)

![财务报表](images/erp-finance-report.png)

重新生成文档截图：`npm run docs:screenshots`；流程冒烟验证：`npm run docs:verify:flows`。

### 人力资源

路径：**人力资源**（需 `hr:*` 权限；演示账号 `hr_clerk`）

| 功能 | 说明 |
|------|------|
| 部门 / 岗位 | 组织主数据 |
| 员工管理 | 工号、部门、岗位档案 |
| 考勤管理 | 出勤签到/签退、请假 |
| 薪资管理 | 工资单核算与发放 |
| 绩效管理 | 考核评分与自动评级 |

完整步骤见 **[详细使用说明 第 11 章](USER_MANUAL.md#11-人力资源)**。

![员工管理](images/erp-hr-employee.png)

![考勤管理](images/erp-hr-attendance.png)

![薪资管理](images/erp-hr-salary.png)

![绩效管理](images/erp-hr-performance.png)

**推荐演练：** 查看 E001 → 登记出勤并签退 → 新建薪资单并发放 → 新建 Q2 绩效考核。

重新生成 HR 截图：`npm run docs:screenshots:hr`。

### 项目管理

路径：**项目管理**（写操作需 `project:manage`；`report:center` 可只读查看）

| 功能 | 说明 |
|------|------|
| 项目列表 | 编码、经理、预算、进度、状态 |
| 任务明细 | 展开行查看任务与负责人 |
| 新建 / 启动 / 完成 | 规划中 → 进行中 → 已完成 |

完整步骤见 **[详细使用说明 第 12 章](USER_MANUAL.md#12-项目管理)**。

![项目管理](images/erp-project-list.png)

![项目任务](images/erp-project-tasks.png)

![新建项目](images/erp-project-create-modal.png)

**推荐演练：** 展开 PRJ001 → 新建测试项目 → 启动 → 完成。

重新生成项目截图：`npm run docs:screenshots:project`。

### 报表中心

路径：**报表中心**（需 `report:center`；演示账号 `employee`）

| 功能 | 说明 |
|------|------|
| 运营概览 | 销售/采购 KPI、趋势图、订单状态分布 |
| 智能分析 | 智能补货 + 智能财务洞察 |
| BI 大屏 | `/bi-screen` 深色全屏（登录即可） |

完整步骤见 **[详细使用说明 第 13 章](USER_MANUAL.md#13-报表与智能分析)**。

![报表中心](images/erp-report-center.png)

![报表图表](images/erp-report-center-charts.png)

**推荐演练：** 查看 KPI 与图表 → 进入智能分析或 BI 大屏。

重新生成报表截图：`npm run docs:screenshots:report`。

### 智能分析

路径：**报表中心 → 智能分析**（`/report/intelligence`）

| Tab | 说明 |
|-----|------|
| 智能补货 | 低于安全库存 → 建议采购量 → 转采购申请 |
| 智能财务 | 应收应付、净头寸、毛利率、资产负债洞察 |

完整步骤见 **[详细使用说明 13.2 节](USER_MANUAL.md#132-智能分析)**。

![智能分析](images/erp-intelligence.png)

![智能补货](images/erp-intelligence-replenishment.png)

![智能补货明细](images/erp-intelligence-replenishment-detail.png)

![智能财务](images/erp-intelligence-finance.png)

**推荐演练：** 提高安全库存 → 查看建议 → 转采购申请 → 切换智能财务 Tab。

重新生成智能分析截图：`npm run docs:screenshots:intelligence`；冒烟：`npm run docs:verify:intelligence`。

### 系统管理

路径：**系统管理**（需 `user:*` / `role:manage` / `system:*` 等权限；`admin` 具备全部）

| 功能 | 说明 |
|------|------|
| 用户 / 角色 | 账号 CRUD、41 项权限按角色分配 |
| 系统配置 | 参数键值 + 数据字典（订单状态等） |
| 审计日志 | 登录、操作、权限拒绝，支持筛选 |
| 租户管理 | 多租户创建，登录时填租户编码 |
| 文件中心 | MinIO 附件上传与预签名下载 |
| 系统集成 | REST 导出主数据 / 订单 / 库存 |
| 线索导入 | 公海 CSV / JSON 批量导入 |

完整步骤见 **[详细使用说明 14 章](USER_MANUAL.md#14-系统管理)**。

![用户管理](images/erp-system-user.png)

![角色管理](images/erp-system-role.png)

![系统配置](images/erp-system-config.png)

![审计日志](images/erp-system-audit.png)

![系统集成](images/erp-system-integration-preview.png)

**推荐演练：** 新建测试用户 → 分配角色 → 审计日志查登录 → 集成预览导出 → 线索 JSON 导入。

重新生成系统管理截图：`npm run docs:screenshots:system`；冒烟：`npm run docs:verify:system`。

### 多租户与预算

- **租户管理**：见上文 [系统管理](#系统管理) 与 [USER_MANUAL §14.5](USER_MANUAL.md#145-租户管理)
- **预算管理**（财务管理 → 预算管理）：按科目/部门设置预算，采购订单审批时自动扣减预算额度

### 批次追溯

库存管理 → **批次追溯**：输入批次号或序列号，查看采购收货、调拨、销售发货等流转记录。

### 批次追溯

Header 铃铛图标可查看站内通知；后端通过 WebSocket 推送新消息（无需手动刷新页面）。

### BI 大屏

侧栏 **BI 大屏** 或访问 `/bi-screen`：全屏运营数据可视化，每 30 秒自动刷新，支持全屏展示。

![BI 大屏](images/erp-bi-screen.png)

完整说明见 **[详细使用说明 13.3 节](USER_MANUAL.md#133-bi-大屏)**。

### 语言切换

登录页或 Header 右上角可切换 **中文 / English**。导航菜单与面包屑会随语言切换；部分业务页面仍为中文。

## 上线培训要点

1. **管理员**：用户/角色/权限配置、系统参数、审计日志查看
2. **采购员**：采购申请 → 采购订单 → 收货流程
3. **销售员**：公海领取 → 联系上报（Web 或 **外勤 App**）；报价 → 销售订单 → 发货 → 售后工单
4. **销售主管**：上报审核、联系统计、团队线索管理（Web + App 审核均可）
5. **仓管员**：库存台账（含批次号）、出入库、调拨、盘点
6. **财务**：采购收货→应付→付款；销售发货→应收→收款；总账过账与财务报表（见 [USER_MANUAL §10](USER_MANUAL.md#10-财务管理)）

建议按角色分批培训，每批 1–2 小时，配合上述业务流程实操。

## 权限说明

- 侧边栏仅显示有权限的菜单
- 直接访问无权限 URL 将显示 403 页面
- 角色权限在 **系统管理 → 角色管理** 中配置

## 常见问题

**Q: 发货提示库存不足？**  
A: 检查 **库存台账** 中对应仓库是否有足够库存，或通过采购收货/生产完工补充库存。

**Q: 库存预警无数据？**  
A: 在 **产品管理** 中为产品设置 **安全库存** 大于 0。

**Q: 报表数据不是最新的？**  
A: **财务报表**在收付款、发货/收货、凭证过账后会立即更新；若页面未变请刷新浏览器。**报表中心 / BI 大屏** 仍有约 1 分钟缓存。

**Q: 应收或应付列表为空？**  
A: 须先完成 **销售发货** 或 **采购收货** 才会自动生成；详见 [USER_MANUAL 第 10 章](USER_MANUAL.md#10-财务管理)。

**Q: 联系上报后主管看不到？**  
A: 主管需 `lead:review` 权限并访问 **销售管理 → 上报审核** 或 **外勤 App → 上报审核**；销售专员无审核权限（403 属正常）。提交后主管会收到 **消息通知**。

**Q: 外勤 App 在哪里下载？**  
A: 见 **[外勤 App 使用说明](FIELD_APP_USER_GUIDE.md)**。

**Q: 录音无法上传？**  
A: 启动 MinIO 并配置 `backend/.env` 中 `MINIO_*` 变量；文件须为音频且 ≤ 10MB。

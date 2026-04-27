# Sprint Change Proposal — 数量数据流转架构前置同步到 Epic

**项目：** infitek_erp  
**日期：** 2026-04-27  
**提案人：** Correct Course Agent  
**审阅人：** friday  
**状态：** Approved & Applied（2026-04-27，friday 已批准）  
**执行模式：** Batch

---

## Section 1: Issue Summary

### 问题陈述

当前 Epic 5 的 Story 5.2 计划在销售订单详情页生成发货需求，并在生成时查询每个 SKU 的可用库存。但库存双层结构、`inventory_summary / inventory_batch` 数据模型、可用库存查询接口目前规划在 Epic 6 Story 6.1 才实现。

这形成了明确的顺序风险：如果直接开发 Story 5.2，开发者只能临时造库存查询方案、硬编码占位字段或跳过库存数据，后续 Story 6.1 落地时必然返工。同时，`packages/shared` 中部分交易单据状态枚举仍是占位版本，未按 2026-04-26 的状态机与 Story 5.1 已落地状态同步，继续开发 5.2 会扩大状态不一致。

### 触发 Story

- **Story 5.2：销售订单列表与详情**
- 触发点：5.2 的“生成发货需求”AC 需要读取当前可用库存，但其依赖能力尚未前置。

### 支撑证据

- `implementation-readiness-report-2026-04-15-new.md` 已标记同一严重问题：库存数据表在 Epic 5 引用前未创建，并建议将 Story 6.1 前移至 Epic 5 前。
- `flow-cross-document-trigger.md` 已明确最新链路：销售订单审核通过后手动触发生成发货需求，并查询每个 SKU 可用库存。
- `flow-state-machine.md` 已明确最新状态机：销售订单从“审核通过”进入“备货中”，发货需求从“待分配库存”进入“采购中/已备货完成/部分发货/已发货/已作废”。
- Story 5.1 已实际落地销售订单状态流：`pending_submit -> in_review -> approved/rejected/voided`，不再是早期“创建即确认”模型。
- 当前 `packages/shared/src/enums/shipping-demand-status.enum.ts` 和 `purchase-order-status.enum.ts` 仍是 `enum` 占位写法，与项目规则“共享枚举用 as const 对象模式”及最新状态机不一致。

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | 影响 | 结论 |
|------|------|------|
| Epic 5 | 5.2 在生成发货需求时依赖库存模型、可用库存查询、shared 状态枚举。当前依赖未前置。 | 需要在 5.2 前新增前置 Story。 |
| Epic 6 | 原 6.1 的库存基础能力被 Epic 5 提前消费。若仍留在 6.1，会形成重复实现或跨 Epic 依赖。 | 需要将 6.1 的基础部分移出 Epic 6。 |
| Epic 7 | 出库校验依赖“本发货需求锁定量”而非全局可用库存。库存模型越早统一，越能避免后续出库逻辑偏差。 | 受益于本次前置。 |
| Epic 8 | 发货需求状态自动流转依赖履行类型、锁定量、采购到货后的库存状态。 | 需消费统一状态枚举和库存基础模型。 |

### Story Impact

| Story | 当前风险 | 建议调整 |
|------|----------|----------|
| 5.2 销售订单列表与详情 | “已确认”触发条件与 Story 5.1 已落地的 `approved` 状态不一致；库存查询无前置接口。 | 改为“审核通过且无未作废发货需求”才展示生成按钮；生成时调用正式 Inventory 查询接口。 |
| 5.3 发货需求列表页 | 依赖发货需求状态枚举。 | 使用前置 Story 同步后的 `ShippingDemandStatus`。 |
| 5.4 发货需求枢纽详情页 | 履行类型、库存锁定、可用库存展示都依赖库存模型与 shared 枚举。 | 使用前置 Story 的库存模型和 `FulfillmentType`。 |
| 5.5 发货需求作废逻辑 | 作废需要释放锁定库存，依赖库存双层模型和状态枚举。 | 使用同一 InventoryService，不做单独库存字段。 |
| 6.1 库存双层结构查询接口与期初录入 | 作为 Epic 6 story 过晚。 | 前移为 Epic 5 前置 Story，Epic 6 不再重复创建模型。 |

### Artifact Conflicts

| Artifact | 冲突点 | 处理建议 |
|----------|--------|----------|
| PRD | 早期范围描述仍有“创建即确认/自动生成发货需求”，但 FR24 已调整为详情页手动触发；状态机章节仍含早期简版状态。 | 本次提案先同步 Epics 和 sprint 顺序；PRD 后续单独清理早期描述。 |
| Epics | Requirements Inventory、FR Coverage、Epic 5/6 概述、Story 5.2、Story 6.1 之间顺序不一致。 | 本次审批后优先修改 `epics.md`。 |
| Architecture | 早期架构正文仍出现单表 `inventory_records` 叙述；最新 flow 文档已采用双层 `inventory_summary / inventory_batch`。 | 后续补一个架构清理项，避免 AI Agent 误读旧结构。 |
| UX | UX 旅程与 InventoryIndicator 已要求发货需求页展示可用库存。 | 无需大改，但 5.2/5.4 AC 必须引用正式库存查询能力。 |
| sprint-status.yaml | 5.2 在 backlog，6.1 也在 backlog，执行顺序未体现前置关系。 | 审批后新增/前移库存前置 Story，移除或重写 Epic 6 的 6.1 条目。 |

### Technical Impact

- 新增库存基础模块必须先落地：`inventory_summary`、`inventory_batch`、InventoryModule、可用库存查询接口、期初录入能力。
- `available_quantity` 必须由 Service 层在事务内维护，不做数据库计算列，遵守 `_bmad-output/project-context.md` 的库存并发规则。
- `packages/shared` 必须先同步交易单据状态枚举和履行类型枚举，避免前后端各自定义。
- 5.2 不允许实现临时库存表、临时 mock API、硬编码库存快照字段。

---

## Section 3: Recommended Approach

### 推荐路径：Direct Adjustment

将原 Epic 6 Story 6.1 的库存基础能力前移到 Epic 5，作为 **Story 5.0：库存双层结构、可用库存查询接口与期初录入（5.2 前置）**。Story 5.0 完成后，再开发当前 Story 5.2。

### 推荐理由

1. **最小返工**：5.2 尚未开始，6.1 也尚未开始，现在调整只改计划，不回滚代码。
2. **保留 MVP 范围**：库存双层结构本来就是 MVP FR39/FR40/FR43，不是新增需求。
3. **保持 Epic 5 可独立验收**：发货需求生成时可真实查询库存，不依赖未来 Epic。
4. **降低技术债**：避免 5.2 写临时库存查询、后续 6.1 再替换。
5. **状态机一致**：shared 枚举先同步，后续 5.2/5.3/5.4/5.5 统一消费。

### 替代方案评估

| 方案 | 结论 | 原因 |
|------|------|------|
| 继续先开发 5.2，库存查询临时处理 | 不推荐 | 会制造短期可跑、长期必拆的临时方案。 |
| 保持 6.1 编号但先跨 Epic 开发 6.1 | 可行但不优 | sprint-status 能表达顺序，但 Epics 仍有向前依赖，不利于后续 Agent 理解。 |
| 降低 5.2 范围，不做库存查询 | 不推荐 | 与 FR24、UX 旅程、发货需求枢纽核心体验冲突。 |
| MVP Review 削减库存双层结构 | 不推荐 | 库存准确性是 MVP 技术成功标准，不能移出。 |

### 工作量与风险

- **工作量估算**：Medium。主要是新增一个前置 Story，实施内容原本已在 6.1 中规划。
- **风险等级**：Medium。库存模型涉及并发与后续多模块消费，但前置能降低总体风险。
- **时间影响**：5.2 开发前增加一个 Story；但避免 5.2 + 6.1 双重返工，整体周期更稳。

---

## Section 4: Detailed Change Proposals

### Proposal 1 — Epics FR Coverage：前移库存基础覆盖

**Artifact**：`_bmad-output/planning-artifacts/epics.md`  
**Section**：FR Coverage Map

**OLD**

```markdown
FR39: Epic 6 Story 6.1 - 库存双层结构数据模型建立（汇总层 inventory_summary + 批次层 inventory_batch）；数据库迁移在 Story 6.1 中随期初录入功能一并落地
FR40: Epic 6 - 期初库存录入/覆盖（批次层创建"期初录入"记录）
FR43: Epic 6 - 库存查询接口（available stock）在 Story 6.1 随数据模型一并建立；历史变动流水查询在 Story 6.2 落地
```

**NEW**

```markdown
FR39: Epic 5 Story 5.0 - 库存双层结构数据模型建立（汇总层 inventory_summary + 批次层 inventory_batch）；数据库迁移在 Story 5.0 中随期初录入功能一并落地，作为 Story 5.2 生成发货需求前置能力
FR40: Epic 5 Story 5.0 - 期初库存录入/覆盖（批次层创建"期初录入"记录），用于 Story 5.2 及后续发货需求库存展示的真实数据来源
FR43: Epic 5 Story 5.0 + Epic 6 Story 6.2 - 可用库存查询接口在 Story 5.0 随数据模型一并建立；历史变动流水查询在 Story 6.2 落地
```

**Rationale**

5.2 生成发货需求必须真实查询库存，FR39/FR40/FR43 的基础部分应在 5.2 前可用。

---

### Proposal 2 — Epic 5 Overview：加入库存与枚举前置

**Artifact**：`_bmad-output/planning-artifacts/epics.md`  
**Section**：Epic 5 概述

**OLD**

```markdown
销售员可以创建销售订单（表单提交即确认），在订单详情页手动触发生成发货需求单（含 SKU 应发量和库存查询）。商务跟单可以在发货需求枢纽详情页完成完整的库存决策——设置履行类型（全部采购/部分采购/使用现有库存），集中确认后系统按 FIFO 自动跨批次完成库存锁定，以及执行发货需求作废操作（释放锁定库存、销售订单回退、支持重新生成）。

**FRs covered:** FR21, FR22, FR23, FR24, FR26（完整实现）, FR28, FR29, FR30, FR49（完整实现）
```

**NEW**

```markdown
销售员可以按已落地状态机创建销售订单并完成提交审核/审核通过流转。系统先在 Story 5.0 前置建立 shared 交易状态枚举、库存双层结构、可用库存查询接口与期初库存录入；随后销售员可在审核通过的销售订单详情页手动触发生成发货需求单（含 SKU 应发量和真实库存查询）。商务跟单可以在发货需求枢纽详情页完成完整的库存决策——设置履行类型（全部采购/部分采购/使用现有库存），集中确认后系统按 FIFO 自动跨批次完成库存锁定，以及执行发货需求作废操作（释放锁定库存、销售订单回退、支持重新生成）。

**FRs covered:** FR21, FR22, FR23, FR24, FR26（完整实现）, FR28, FR29, FR30, FR39（基础模型）, FR40（期初录入）, FR43（可用库存查询）, FR49（完整实现）
```

**Rationale**

Epic 5 应显式表达“库存基础先落地，再生成发货需求”的执行顺序。

---

### Proposal 3 — 新增 Story 5.0：库存双层结构、可用库存查询接口与期初录入

**Artifact**：`_bmad-output/planning-artifacts/epics.md`  
**Location**：Epic 5，Story 5.1 之后、Story 5.2 之前

**NEW**

```markdown
### Story 5.0: 库存双层结构、可用库存查询接口与期初录入（5.2 前置）

As a 系统管理员和开发者,
I want 在生成发货需求前先建立统一的交易状态枚举、库存双层结构、期初库存录入和可用库存查询接口,
So that Story 5.2 可以基于正式库存数据生成发货需求，避免临时库存方案和后续返工。

**Acceptance Criteria:**

**Given** `packages/shared` 作为前后端共享类型包
**When** 查看交易单据相关枚举
**Then** `ShippingDemandStatus` 使用 `as const` 对象模式定义：`PENDING_ALLOCATION`（待分配库存）、`PURCHASING`（采购中）、`STOCK_READY`（已备货完成）、`PARTIALLY_SHIPPED`（部分发货）、`SHIPPED`（已发货）、`VOIDED`（已作废）
**And** 新增 `FulfillmentType`：`FULL_PURCHASE`（全部采购）、`PARTIAL_PURCHASE`（部分采购）、`USE_STOCK`（使用现有库存）
**And** 新增库存相关枚举：`InventoryBatchSourceType`（期初录入/采购入库）、`InventoryChangeType`（期初录入/采购入库/发货出库/锁定/解锁）
**And** 所有新增枚举从 `packages/shared/src/index.ts` 导出，禁止前后端重复定义

**Given** 后端库存模块
**When** 运行数据库迁移
**Then** 创建汇总层 `inventory_summary`：id、sku_id（FK）、warehouse_id（FK）、actual_quantity（默认 0）、locked_quantity（默认 0）、available_quantity（默认 0，由 Service 层维护，不使用数据库计算列）、created_at、updated_at、created_by、updated_by
**And** 创建批次层 `inventory_batch`：id、sku_id（FK）、warehouse_id（FK）、batch_quantity、batch_locked_quantity、source_type（期初录入/采购入库）、source_document_id、receipt_date（FIFO 排序依据）、created_at、updated_at、created_by、updated_by
**And** 汇总层和批次层保持一致：汇总层数量由批次层聚合及库存操作同步维护（FR39）

**Given** 系统管理员进入期初库存录入页面
**When** 选择 SKU 和仓库，填写期初数量并提交
**Then** 在批次层创建或覆盖 `source_type=INITIAL` 的期初批次
**And** 汇总层对应 SKU+仓库的 actual_quantity 与 available_quantity 同步更新（FR40）

**Given** 授权用户或 Story 5.2 生成发货需求逻辑调用库存查询接口
**When** GET `/api/v1/inventory/available?skuIds=1,2,3`
**Then** 返回每个 SKU 在各仓库的实际库存、锁定量、可用库存：`[{ skuId, warehouseId, actualQuantity, lockedQuantity, availableQuantity }]`
**And** 可选 `warehouseId` 参数用于限定单个仓库
**And** 若某 SKU+仓库 尚无 inventory_summary 记录，则返回 availableQuantity=0，不报错（FR43）
**And** 响应时间 < 1 秒（NFR-P6）

**Given** 后续库存写操作
**When** 涉及锁定/解锁/扣减/增加
**Then** 必须通过 InventoryService 的 QueryRunner 事务 + SELECT ... FOR UPDATE 执行
**And** 死锁时指数退避最多 3 次，超限抛 ConflictException({ code: 'CONCURRENT_UPDATE' })

**Given** Story 5.2 还未开始
**When** Story 5.0 未完成
**Then** 不允许开始 Story 5.2 的“生成发货需求”实现，避免临时库存查询方案
```

**Rationale**

这不是新增范围，而是将原 6.1 的基础能力移动到 5.2 之前，并同步 shared 枚举。

---

### Proposal 4 — Story 5.2：生成发货需求 AC 与已落地状态机对齐

**Artifact**：`_bmad-output/planning-artifacts/epics.md`  
**Section**：Story 5.2 Acceptance Criteria

**OLD**

```markdown
**Given** 销售订单状态为"已确认"且尚未生成发货需求
**When** 查看详情页操作区
**Then** 展示"生成发货需求"按钮（Primary 蓝色实心，UX-DR15）
```

**NEW**

```markdown
**Given** 销售订单状态为"审核通过"（`SalesOrderStatus.APPROVED`）且不存在未作废的关联发货需求
**When** 查看详情页操作区
**Then** 展示"生成发货需求"按钮（Primary 蓝色实心，UX-DR15）
```

**OLD**

```markdown
**Given** 授权用户点击"生成发货需求"按钮
**When** 系统弹出 Popconfirm（UX-DR16 状态推进）："确认为此订单生成发货需求？"
**Then** 确认后系统生成发货需求单，包含所有 SKU 及应发数量（FR24）
**And** 系统自动查询每个 SKU 的当前可用库存并记录到发货需求行项
**And** 前端展示 Notification.success（UX-DR17 重要成功），包含"查看发货需求"链接
**And** "生成发货需求"按钮隐藏，关联单据区显示发货需求编号蓝色链接
```

**NEW**

```markdown
**Given** 授权用户点击"生成发货需求"按钮
**When** 系统弹出 Popconfirm（UX-DR16 状态推进）："确认为此订单生成发货需求？"
**Then** 确认后系统生成发货需求单，包含所有 SKU 及应发数量（FR24）
**And** 后端调用 Story 5.0 建立的 InventoryService / `GET /api/v1/inventory/available` 查询每个 SKU 在各仓库的当前可用库存
**And** 发货需求行项记录应发数量、可用库存快照、初始履行类型 null，发货需求状态为 `ShippingDemandStatus.PENDING_ALLOCATION`
**And** 销售订单状态从 `SalesOrderStatus.APPROVED` 推进为 `SalesOrderStatus.PREPARING`
**And** 前端展示 Notification.success（UX-DR17 重要成功），包含"查看发货需求"链接
**And** "生成发货需求"按钮隐藏，关联单据区显示发货需求编号蓝色链接
**And** 禁止为本 Story 实现临时库存表、mock 库存 API 或硬编码可用库存
```

**Rationale**

5.2 必须消费正式库存查询接口，并以 Story 5.1 已落地的 `approved/preparing` 状态为准。

---

### Proposal 5 — Epic 6：移除重复的库存基础创建职责

**Artifact**：`_bmad-output/planning-artifacts/epics.md`  
**Section**：Epic 6 概述与 Story 6.1

**OLD**

```markdown
Story 6.1 首先建立库存双层数据模型（inventory_summary + inventory_batch）并落地库存查询接口和期初录入（FR39、FR40、FR43）。
```

**NEW**

```markdown
库存双层数据模型、期初录入和可用库存查询接口已在 Epic 5 Story 5.0 前置落地。Epic 6 不再重复创建库存基础表和查询接口，而是在采购订单、收货入库、请购型收货自动锁定、库存变动流水中消费同一 InventoryModule。
```

**Story 6.1 处理建议**

- 原 Story 6.1 内容移动到 Story 5.0。
- Epic 6 中删除原 `Story 6.1: 库存双层结构、查询接口与期初录入`，或改为“库存模型接入复核”说明性条目，不作为独立开发 Story。
- 保留 Story 6.2+ 的流水、采购、收货、自动锁定职责，避免重复建表。

**Rationale**

Epic 6 应消费库存基础能力，而不是在 Epic 5 已使用后再建立基础能力。

---

### Proposal 6 — sprint-status.yaml：体现 5.2 前置顺序

**Artifact**：`_bmad-output/implementation-artifacts/sprint-status.yaml`

**OLD**

```yaml
epic-5: in-progress
5-1-销售订单创建与确认: done
5-2-销售订单列表与详情: backlog
5-3-发货需求列表页: backlog
5-4-发货需求枢纽详情页: backlog
5-5-发货需求下游入口与完整作废逻辑: backlog

epic-6: backlog
6-1-库存双层结构查询接口与期初录入: backlog
6-2-库存变动流水: backlog
```

**NEW**

```yaml
epic-5: in-progress
5-1-销售订单创建与确认: done
5-0-库存双层结构查询接口与期初录入: backlog
5-2-销售订单列表与详情: backlog
5-3-发货需求列表页: backlog
5-4-发货需求枢纽详情页: backlog
5-5-发货需求下游入口与完整作废逻辑: backlog

epic-6: backlog
6-2-库存变动流水: backlog
6-3-采购订单创建与确认: backlog
```

**Rationale**

sprint-status 必须让 Dev Agent 明确：下一个应开发的不是 5.2，而是库存和枚举前置 Story。

---

## Section 5: Implementation Handoff

### Change Scope

**Moderate** — 需要 backlog / Epic 重组，但不需要产品目标重定义，也不需要回滚已完成代码。

### Handoff Recipients

| 角色 | 责任 |
|------|------|
| PO / Developer | 审批本提案后更新 `epics.md` 与 `sprint-status.yaml`。 |
| SM / Developer | 基于新增 Story 5.0 创建具体 Story 文件，确保 Dev Notes 指向 Story 5.1 已落地状态机与库存并发规则。 |
| Developer | 先实现 Story 5.0，再实现 Story 5.2。 |
| Reviewer | 重点检查 5.2 是否只调用正式 InventoryService，是否没有临时库存方案。 |

### Implementation Order

1. 审批本 Sprint Change Proposal。
2. 更新 `epics.md`：新增 Story 5.0，调整 FR Coverage、Epic 5/6 概述、Story 5.2 AC。
3. 更新 `sprint-status.yaml`：新增 `5-0-库存双层结构查询接口与期初录入`，移除或重写原 6.1。
4. 运行 `bmad-create-story` 创建 Story 5.0。
5. 开发 Story 5.0：shared 枚举、InventoryModule、迁移、查询接口、期初录入。
6. Story 5.0 review done 后，再开发 Story 5.2。

### Success Criteria

- `packages/shared` 中交易状态和履行类型枚举全部用 `as const` 对象模式，统一导出。
- Story 5.0 提供正式库存双层表、期初库存录入、可用库存查询接口。
- Story 5.2 生成发货需求时不出现临时库存实现。
- 5.2 触发条件与 Story 5.1 已落地状态机一致：`approved -> preparing`。
- 后续 5.3/5.4/5.5、6.x、7.x 均消费同一 InventoryModule 和 shared 枚举。

---

## Change Navigation Checklist Summary

| Checklist Item | Status | Notes |
|----------------|--------|-------|
| 1.1 Triggering Story | Done | Story 5.2。 |
| 1.2 Core Problem | Done | 跨 Epic 时序违规 + shared 枚举未同步。 |
| 1.3 Evidence | Done | Readiness report、flow docs、Story 5.1 实现、shared 枚举现状。 |
| 2.1 Current Epic Impact | Done | Epic 5 需新增 5.0 前置。 |
| 2.2 Epic-Level Changes | Done | 已更新 `epics.md`，新增 Story 5.0 并调整 Epic 5/6 边界。 |
| 2.3 Future Epic Review | Done | Epic 6/7/8 受影响但不需重规划 MVP。 |
| 2.4 New Epic Needed | N/A | 不需要新增 Epic。 |
| 2.5 Order/Priority Change | Done | 5.0 必须在 5.2 前执行。 |
| 3.1 PRD Conflict | Action-needed | PRD 早期描述后续清理；本次先同步 Epics。 |
| 3.2 Architecture Conflict | Action-needed | 架构旧 `inventory_records` 段落后续清理。 |
| 3.3 UX Conflict | Done | UX 要求可用库存展示，支持本次前置。 |
| 3.4 Other Artifacts | Done | 已更新 `sprint-status.yaml`，将库存前置 Story 放入 Epic 5。 |
| 4.1 Direct Adjustment | Viable | 推荐路径。 |
| 4.2 Potential Rollback | Not viable | 无需回滚，5.2 尚未开始。 |
| 4.3 MVP Review | Not viable | 库存双层结构属于 MVP 核心。 |
| 4.4 Recommended Path | Done | Direct Adjustment。 |
| 5.1 Issue Summary | Done | 已完成。 |
| 5.2 Impact and Artifact Needs | Done | 已完成。 |
| 5.3 Recommended Path | Done | 已完成。 |
| 5.4 PRD MVP Impact | Done | MVP 不缩减。 |
| 5.5 Handoff Plan | Done | 已完成。 |
| 6.1 Checklist Review | Done | 已完成。 |
| 6.2 Proposal Accuracy | Done | 已自检。 |
| 6.3 User Approval | Done | friday 已审批 Approve（2026-04-27）。 |
| 6.4 sprint-status Update | Done | 已新增 `5-0-库存双层结构查询接口与期初录入`，移除 Epic 6 的 `6-1` backlog 条目。 |
| 6.5 Next Steps | Done | 下一步进入 `bmad-create-story` 创建 Story 5.0。 |

---

## Approval Result

friday 已在 2026-04-27 审批 **Approve**。本提案已应用：

- 已更新 `epics.md`：新增 Story 5.0，调整 FR Coverage、Epic 5/6 概述、Story 5.2 AC，并将原 Story 6.1 标记为已前移。
- 已更新 `sprint-status.yaml`：新增 `5-0-库存双层结构查询接口与期初录入`，移除 Epic 6 的 `6-1` backlog 条目。
- 下一步：运行 `bmad-create-story` 创建 Story 5.0，再进入开发。

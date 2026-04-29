# Sprint Change Proposal: 发货需求新增“待生成采购单”状态

Date: 2026-04-29
Project: infitek_erp
Owner: friday
Mode: Batch
Skill: bmad-correct-course

## 1. Issue Summary

发货需求详情页完成“分配库存/确认分配”后，只要任一明细包含“全部采购”或“部分采购”，当前系统会立即把发货需求状态推进为 `purchasing`（采购中）。但此时采购订单尚未生成，业务上还没有进入采购执行阶段。该状态会误导采购/商务认为采购单已经创建或采购流程已经启动。

触发点来自 Story 5.4 的确认分配闭环：当前后端 `confirm-allocation` 根据是否存在采购数量直接选择 `purchasing` 或 `prepared`。证据：

- `packages/shared/src/enums/shipping-demand-status.enum.ts` 当前 `ShippingDemandStatus` 仅包含 `pending_allocation`、`purchasing`、`prepared`、`partially_shipped`、`shipped`、`voided`。
- `apps/api/src/modules/shipping-demands/shipping-demands.service.ts` 的 `confirmAllocationInTransaction()` 中，`hasPurchaseQuantity ? ShippingDemandStatus.PURCHASING : ShippingDemandStatus.PREPARED`。
- `apps/web/src/pages/shipping-demands/detail.tsx` 的状态标签、FlowProgress、SmartButton 仍将 `purchasing` 映射到“采购备货/采购中”。
- 参考 UX 原型存在于原始 repo：`/Users/chenkangping/ai_study/infitek_erp/_bmad-output/prototypes/shipping-demand-status-flow-prototype.html`；当前 worktree 的 `_bmad-output/prototypes/` 尚未包含该文件，需同步或补入。

问题类型：业务状态机口径不完整，不是技术实现失败。需要在发货需求“确认分配”和“采购订单创建成功”之间增加中间状态，避免状态提前表达采购执行进度。

约束入口：本 Sprint Change Proposal 是本次状态机纠偏的总入口。后续创建或开发 Story 5.6、6.3、6.6、7.1 时，必须先引用本文，再读取已更新的 `flow-state-machine.md`、`flow-quantity-data-lineage.md` 和 `epics.md`；HTML 原型只作为视觉证据，不作为唯一约束来源。

## 2. Checklist Findings

| Checklist Item | Status | Finding |
|---|---|---|
| 1.1 Triggering story | Done | 触发于 Story 5.4 发货需求枢纽详情页的确认分配闭环；影响 Story 5.5 下游入口和 Epic 6/7 后续故事。 |
| 1.2 Core problem | Done | `purchasing` 被用于“有采购缺口”而非“采购单已生成/采购执行中”，语义过早。 |
| 1.3 Evidence | Done | shared 枚举缺状态，后端确认分配直接推进 `purchasing`，前端标签和流程条均缺“待生成采购单”。 |
| 2.1 Current epic impact | Done | Epic 5 已完成故事需补丁，不建议回滚；补丁应保留现有库存锁定和物流单入口成果。 |
| 2.2 Epic-level changes | Action-needed | Epic 5 增加补丁故事或在 5.4/5.5 追加变更记录；Epic 6 Story 6.3 必须承担状态推进到 `purchasing`。 |
| 2.3 Future epics | Done | Epic 6 采购单创建、收货自动锁定受影响；Epic 7 物流单数量口径需继续只用已锁定待发量。 |
| 2.4 New epic need | N/A | 不需要新增 Epic；现有 Epic 5/6/7/8 可承载。 |
| 2.5 Sequence impact | Done | Epic 6.3 前必须先完成 shared 枚举、确认分配状态、UI 标签/流程条补丁。 |
| 3.1 PRD conflicts | Action-needed | PRD FR27/FR35、状态机简版描述需补“待生成采购单”。 |
| 3.2 Architecture conflicts | Action-needed | flow-state-machine、flow-quantity-data-lineage、flow-cross-document-trigger 需更新状态边界。 |
| 3.3 UX conflicts | Action-needed | 发货需求详情/列表/销售订单关联状态、ActivityTimeline、FlowProgress 需补标签与步骤。 |
| 3.4 Other artifacts | Action-needed | Story 5.4、5.5、Epic 6.3/6.5/6.6、Epic 7.1 文本和测试用例需同步。 |
| 4.1 Direct adjustment | Viable | 低到中等工作量，业务风险低，能保留已完成成果。 |
| 4.2 Rollback | Not viable | 回滚 Story 5.4/5.5 会丢失已完成的库存锁定和物流入口能力，收益低。 |
| 4.3 MVP review | Not viable | MVP 仍可达成，不需要缩小范围。 |
| 4.4 Recommended path | Done | 选择 Direct Adjustment。 |
| 5.1-5.5 Proposal components | Done | 本文给出问题摘要、影响、方案、具体 edit proposals 和 handoff。 |
| 6.1-6.2 Final review | Done | 提案已按 Batch 汇总。 |
| 6.3 Approval | Action-needed | 需用户审批后再实施代码/文档更新。 |
| 6.4 sprint-status update | N/A before approval | 当前不更新 sprint-status；审批后如新增补丁 story 再更新。 |

## 3. Impact Analysis

### Epic Impact

| Epic | Impact | Required Change |
|---|---|---|
| Epic 5 销售订单与发货需求管理 | Story 5.4/5.5 已 done，但状态机口径需要补丁。 | 增加 Epic 5 补丁故事，或在 Story 5.4 变更记录追加“待生成采购单”状态修正；确认分配含采购数量时进入 `pending_purchase_order`。 |
| Epic 6 采购订单与收货入库 | Story 6.3 是从“待生成采购单”进入“采购中”的责任点。 | 创建请购型采购订单成功后，回填 `purchaseOrderedQuantity`，将发货需求从 `pending_purchase_order` 推进到 `purchasing`。采购单可下单数量为 `purchaseRequiredQuantity - purchaseOrderedQuantity`。 |
| Epic 7 物流单与发货出库 | 用户已强调物流单只能使用已锁定待发数量，不能使用待采购数量。 | Story 7.1/已完成 5.5 的物流表单继续校验 `locked_remaining_quantity - active_logistics_planned_quantity`，不允许从待采购数量预填物流计划。 |
| Epic 8 发货需求状态自动流转 | 状态自动流转规则缺少中间态。 | Story 8.1 改为：确认分配含采购数量 -> 待生成采购单；采购订单创建成功 -> 采购中；收货锁定完成 -> 备货完成。 |

### Artifact Conflicts

| Artifact | Conflict | Change Needed |
|---|---|---|
| PRD | FR27/FR35 只说从发货需求创建采购订单，未明确“确认分配后尚未生成 PO”的状态。 | 新增状态定义和 FR：待生成采购单是确认分配后的采购缺口等待下单阶段。 |
| `flow-state-machine.md` | 发货需求从“待分配库存”直接到“采购中”。 | 插入“待生成采购单”。 |
| `flow-cross-document-trigger.md` | 完整触发链中确认分配后含采购直接进入采购中。 | 改为确认分配后进入待生成采购单，生成采购订单成功后进入采购中。 |
| `flow-quantity-data-lineage.md` | 4.3、4.4、5.1、6.共享枚举仍以 `purchasing` 表达采购缺口。 | 更新数量事件矩阵、状态聚合、枚举目标值和 Story 落地要求。 |
| Story 5.4 | 当前 AC/完成记录要求含采购数量进入采购中。 | 改为 `pending_purchase_order`，保留库存部分锁定和明细采购数量写入。 |
| Story 5.5 | 下游入口已包括物流单，采购单入口仍为占位/禁用。 | 补充采购 SmartButton 在 `pending_purchase_order`/`purchasing` 显示入口；物流入口只看已锁定待发量。 |
| Story 6.3 | 当前只要求创建采购订单，不承担发货需求状态推进和 `purchaseOrderedQuantity` 回填。 | 新增 AC：PO 创建成功后推进状态，按可下单数量创建，支持多次补单。 |
| Story 6.5/6.6 | 收货后自动锁定仍合理，但前置状态应为采购中。 | 保持请购型自动锁定规则，补充发货需求若处于 `purchasing` 时按锁定完成度推进 `prepared`。 |
| Story 7.1/已完成物流表单 | 旧 Epic 文本有“SKU 和数量从发货需求行项继承，数量可编辑”的歧义。 | 明确数量上限只来自已锁定未计划量，不得继承待采购数量。 |
| ActivityTimeline | 文案映射缺新状态。 | 新增 `pending_purchase_order: 待生成采购单`，状态变更日志可读。 |
| UI 原型 | 原型在原始 repo，worktree 未同步。 | 将原型同步到 worktree 或在 UX 文档中引用原始路径。 |

### Technical Impact

- `packages/shared` 新增 `ShippingDemandStatus.PENDING_PURCHASE_ORDER = 'pending_purchase_order'`。
- 数据库 `shipping_demands.status` 若为 varchar，无需迁移；若后续使用 enum 约束，则需 migration 扩展允许值。
- 后端 `confirm-allocation` 状态推进规则改为：
  - 全部明细走库存且锁定完成 -> `prepared`
  - 任一明细有 `purchaseRequiredQuantity > 0` -> `pending_purchase_order`
- 采购订单创建动作新增领域责任：
  - 仅允许从 `pending_purchase_order` 或 `purchasing` 的发货需求生成请购型 PO。
  - PO 行数量 <= `purchaseRequiredQuantity - purchaseOrderedQuantity`。
  - 创建成功后聚合回填 `purchaseOrderedQuantity`。
  - 若发货需求原状态为 `pending_purchase_order` 且本次至少创建一张有效 PO，则推进为 `purchasing`。
- 收货入库确认后维持原规则：请购型采购行收货后自动锁定到对应发货需求明细；全部应发数量锁定完成后发货需求推进 `prepared`。
- 前端所有状态映射、筛选项、详情页 FlowProgress、销售订单详情关联展示、ActivityTimeline 增加新状态。
- 物流单创建后端和表单继续只使用已锁定待发数量：`lockedRemainingQuantity - activeLogisticsPlannedQuantity`。

## 4. Recommended Approach

推荐路径：Direct Adjustment。

理由：

- 本次问题是状态语义提前，不是库存锁定模型失败；不需要回滚 Story 5.4/5.5。
- 已完成的 `shipping_demand_inventory_allocations`、库存流水、物流单可计划数量校验都应保留。
- Epic 6 尚未开始，是承接“生成采购单后才进入采购中”的最佳时机。
- 增加中间态能降低跨部门误解，也让采购单未生成、采购中、备货完成三个阶段在 UI 上可观察。

范围分类：Moderate。

建议拆分：

1. **补丁故事：Story 5.6（建议新增）发货需求待生成采购单状态纠偏**
   - 当前可立即实现范围仅限已开发链路的状态纠偏：同步 shared 枚举、后端 `confirm-allocation`、前端标签/流程条/时间线、现有测试。
   - `confirm-allocation` 含采购数量时只推进到 `pending_purchase_order`，不创建采购订单，不回填 `purchaseOrderedQuantity`，不推进 `purchasing`。
   - 更新 planning artifacts 和已完成 Story 文档，为 Epic 6/7 后续 Story 固化约束。
2. **Epic 6.3 采购订单创建与确认**
   - 暂不在 Story 5.6 实现。
   - 在 Epic 6.3 原故事中实现采购单创建、`purchaseOrderedQuantity` 回填、状态推进到 `purchasing`。
3. **Epic 6.6 收货后自动触发**
   - 暂不在 Story 5.6 实现。
   - 在 Epic 6.6 原故事中实现请购型收货后 FIFO 自动锁定和全部应发数量锁定完成后的 `prepared` 推进。
4. **Epic 7.1/已完成 5.5 物流入口**
   - 保持“只可用已锁定待发量”的表单/后端校验，并补文档口径。

### Scope Split Clarification

本提案按“当前修正 Story 可立即实现”和“后续 Story 约束固化”拆分，不把 Epic 6 未开发能力提前塞入 Story 5.6。

**进入当前修正 Story 5.6 的变更：**

- 新增 shared `ShippingDemandStatus.PENDING_PURCHASE_ORDER = 'pending_purchase_order'`。
- 修改已开发的发货需求确认分配动作：`POST /shipping-demands/:id/confirm-allocation` 在存在采购数量时将发货需求推进到 `pending_purchase_order`，不再推进到 `purchasing`。
- 保持全库存路径：全部明细使用现有库存且锁定完成后仍进入 `prepared`。
- 更新已开发 UI 的状态标签、筛选、详情页 FlowProgress、采购 SmartButton 占位文案、销售订单关联展示、ActivityTimeline 文案。
- 更新现有测试，覆盖含采购数量确认分配 -> `pending_purchase_order`，全库存确认分配 -> `prepared`，物流单不能使用待采购数量。

**本次只更新 flow 文档、epics 和后续 Story AC，不在 Story 5.6 实现的变更：**

- Epic 6 Story 6.3：采购订单创建成功后，系统回填发货需求明细 `purchaseOrderedQuantity`，并将发货需求从 `pending_purchase_order` 推进到 `purchasing`。
- Epic 6 Story 6.6：请购型采购订单收货后，系统按 FIFO 自动锁定到对应发货需求明细；全部应发数量锁定完成后，将发货需求推进到 `prepared`。
- Epic 7 Story 7.1：物流单创建继续只读取已锁定且未被 active 物流单计划的待发数量，不读取待采购数量。

**后续 Story 创建约束：**

- 创建 Story 6.3 或 6.6 时，必须引用本 Sprint Change Proposal。
- 创建 Story 6.3 或 6.6 时，必须引用 UX 原型 `_bmad-output/prototypes/shipping-demand-status-flow-prototype.html`；若当前 worktree 缺失该原型，需先从原始项目路径同步或在 Story Dev Notes 中记录缺失与替代引用。
- Story 6.3 / 6.6 的 Dev Notes 必须继续加载 Epic 5-7 三份 flow context，并以本提案修正后的 flow 文档作为冲突裁决依据。
- 后续 Story 不能只引用 HTML 原型；必须引用本文和文档化约束：`flow-state-machine.md` 的状态链、`flow-quantity-data-lineage.md` 的数量回填规则、`epics.md` 的 Story 6.3 / 6.6 AC。

## 5. Detailed Change Proposals

### Proposal A — Shared Enum

Target: `packages/shared/src/enums/shipping-demand-status.enum.ts`

OLD:

```ts
export const ShippingDemandStatus = {
  PENDING_ALLOCATION: 'pending_allocation',
  PURCHASING: 'purchasing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  VOIDED: 'voided',
} as const;
```

NEW:

```ts
export const ShippingDemandStatus = {
  PENDING_ALLOCATION: 'pending_allocation',
  PENDING_PURCHASE_ORDER: 'pending_purchase_order',
  PURCHASING: 'purchasing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  VOIDED: 'voided',
} as const;
```

Rationale:

`pending_purchase_order` 表达“采购需求已确认，但采购订单尚未生成”。`purchasing` 仅表达“至少已有请购型采购订单创建成功，进入采购执行/收货等待阶段”。

### Proposal B — Backend Confirm Allocation

Target: `apps/api/src/modules/shipping-demands/shipping-demands.service.ts`

OLD:

```ts
const nextStatus = hasPurchaseQuantity
  ? ShippingDemandStatus.PURCHASING
  : ShippingDemandStatus.PREPARED;
```

NEW:

```ts
const nextStatus = hasPurchaseQuantity
  ? ShippingDemandStatus.PENDING_PURCHASE_ORDER
  : ShippingDemandStatus.PREPARED;
```

Additional rules:

- `pending_purchase_order` 状态下不允许再次确认分配。
- 库存部分仍按 FIFO 锁定并写 allocation。
- 采购部分只写 `purchaseRequiredQuantity`，不生成采购单，不写 `purchaseOrderedQuantity`。
- 销售订单状态仍保持 `preparing`，直到发货需求全部锁定后才变 `prepared`。
- ActivityTimeline 记录“确认分配：含采购缺口，等待生成采购单”。

Rationale:

确认分配只是形成采购缺口，不代表采购单已生成。

### Proposal C — Purchase Order Creation Responsibility

Target: Epic 6 Story 6.3 and future `PurchaseOrdersService.createFromShippingDemand()`

Scope note:

本 Proposal 只作为 Epic 6.3 的后续 Story AC 和 flow 文档约束，不进入当前 Story 5.6 的代码实现范围。Story 5.6 只暴露 `pending_purchase_order` 状态和“生成采购单”入口/占位，不创建采购订单。

OLD:

```md
**Given** 商务跟单确认采购分组预览
**When** 点击"确认创建"
**Then** 系统按供应商分组批量生成采购订单，类型标注"请购型"（FR35）
**And** 每张采购订单自动关联供应商、预填 SKU 和数量、关联发货需求
**And** 合同条款默认关联该供应商已审批的第一条范本（FR35）
**And** 所有生成的采购订单状态为"已确认"（FR36）
```

NEW:

```md
**Given** 发货需求状态为 `pending_purchase_order` 或 `purchasing`
**And** 存在 `purchaseRequiredQuantity > purchaseOrderedQuantity` 的发货需求明细
**When** 商务跟单在发货需求详情页点击"生成采购单"
**Then** PurchaseGroupPreview 仅展示可下单数量大于 0 的明细
**And** 每行默认可下单数量 = `purchaseRequiredQuantity - purchaseOrderedQuantity`
**And** 用户本次下单数量不得超过该可下单数量

**Given** 商务跟单确认采购分组预览
**When** 后端成功创建一张或多张请购型采购订单
**Then** 采购订单行必须关联 `shippingDemandId` 与 `shippingDemandItemId`
**And** 后端聚合回填发货需求明细 `purchaseOrderedQuantity`
**And** 若发货需求状态为 `pending_purchase_order`，则推进为 `purchasing`
**And** ActivityTimeline 记录采购订单创建和状态变更
```

Rationale:

采购订单创建动作才是采购执行开始的业务边界。

### Proposal D — Flow State Machine

Target: `_bmad-output/planning-artifacts/flow-state-machine.md`

OLD:

```mermaid
待分配库存 --> 已备货完成: 集中确认-全部SKU使用现有库存-库存锁定完成
待分配库存 --> 采购中: 集中确认-含至少一行需采购的SKU
采购中 --> 已备货完成: 所有需采购SKU均已到货且全部库存锁定到位
```

NEW:

```mermaid
待分配库存 --> 已备货完成: 集中确认-全部SKU使用现有库存-库存锁定完成
待分配库存 --> 待生成采购单: 集中确认-含至少一行需采购的SKU
待生成采购单 --> 采购中: 请购型采购订单创建成功
采购中 --> 已备货完成: 所有应发数量均已锁定到位
```

Update explanatory notes:

- “采购中”不再表示“存在采购缺口”，只表示“采购订单已生成，等待供应商确认/收货/自动锁定”。
- 采购订单取消后，若没有任何未取消采购订单且仍有可下单缺口，发货需求是否回到 `pending_purchase_order` 需产品决策；MVP 建议不自动回退，保持 `purchasing`，并在详情页继续允许补单。

Rationale:

状态名必须对应真实业务阶段。

### Proposal E — Cross-document Trigger Flow

Target: `_bmad-output/planning-artifacts/flow-cross-document-trigger.md`

OLD:

```mermaid
E --> F1{是否含需采购的SKU}
F1 -->|否-全部使用现有库存| M[发货需求状态变为已备货完成]
F1 -->|是| F[发货需求状态变为采购中]

F --> H[按供应商分组创建采购订单]
```

NEW:

```mermaid
E --> F1{是否含需采购的SKU}
F1 -->|否-全部使用现有库存| M[发货需求状态变为已备货完成]
F1 -->|是| F0[发货需求状态变为待生成采购单]

F0 --> H[按供应商分组生成采购订单]
H --> F[发货需求状态变为采购中]
```

Rationale:

触发链中要明确“确认采购缺口”和“生成采购单”是两个动作。

### Proposal F — Quantity Data Lineage

Target: `_bmad-output/planning-artifacts/flow-quantity-data-lineage.md`

Scope note:

本 Proposal 中 4.3 “确认库存分配”进入 Story 5.6 当前实现；4.4 “创建请购型采购订单”的状态推进和 `purchaseOrderedQuantity` 回填只更新文档与 Epic 6.3 AC，不在 Story 5.6 实现。

OLD:

```md
### 4.3 确认库存分配
状态影响 | 若无采购部分且全部锁定 -> 发货需求 `prepared`、销售订单 `prepared`；否则发货需求 `purchasing`。

### 4.4 创建请购型采购订单
前置状态 | 发货需求 `purchasing`。
```

NEW:

```md
### 4.3 确认库存分配
状态影响 | 若无采购部分且全部锁定 -> 发货需求 `prepared`、销售订单 `prepared`；否则发货需求 `pending_purchase_order`。

### 4.4 创建请购型采购订单
前置状态 | 发货需求 `pending_purchase_order` 或 `purchasing`，且存在 `purchase_required_quantity > purchase_ordered_quantity` 的明细。
状态影响 | 至少一张请购型采购订单创建成功后，若发货需求为 `pending_purchase_order`，推进为 `purchasing`。
```

Update `5.1 发货需求状态`:

| Target Status | New Condition |
|---|---|
| `pending_allocation` | 已生成但尚未确认库存分配。 |
| `pending_purchase_order` | 已确认分配，存在采购缺口，但尚未创建任何有效请购型采购订单。 |
| `purchasing` | 已创建至少一张有效请购型采购订单，且仍存在未完全锁定的应发数量。 |
| `prepared` | 所有明细 `locked_remaining_quantity + shipped_quantity = required_quantity`，且尚未出库完成。 |

Update shared enum table:

```md
`ShippingDemandStatus` | `pending_allocation`、`pending_purchase_order`、`purchasing`、`prepared`、`partially_shipped`、`shipped`、`voided`
```

Rationale:

数量字段 `purchaseRequiredQuantity` 与 `purchaseOrderedQuantity` 已经能表达“需采购但未下单”和“已下单”，状态机应消费这一区分。

### Proposal G — PRD

Target: `_bmad-output/planning-artifacts/prd.md`

OLD:

```md
- 发货需求：**待分配库存**（初始状态）-> 处理中 -> 待发运 -> 已发运 | 已作废
```

NEW:

```md
- 发货需求：**待分配库存**（初始状态）-> 待生成采购单（存在采购缺口但尚未生成采购订单）-> 采购中（请购型采购订单已生成，等待收货/锁定）-> 备货完成 -> 部分发货 -> 已发货 | 已作废
```

OLD FR27:

```md
采购订单行仅包含履行类型为"全部采购"或"部分采购"的 SKU（数量自动预填：全部采购取应发数量，部分采购取用户填写的采购数量）
```

NEW FR27:

```md
采购订单行仅包含履行类型为"全部采购"或"部分采购"且仍有可下单数量的 SKU；可下单数量 = `purchaseRequiredQuantity - purchaseOrderedQuantity`。采购订单创建成功后，系统回填 `purchaseOrderedQuantity`，并将发货需求从"待生成采购单"推进为"采购中"。
```

Rationale:

PRD 必须明确业务阶段名称，避免后续故事继续沿用旧“处理中/采购中”混合口径。

### Proposal H — Story 5.4

Target: `_bmad-output/implementation-artifacts/5-4-发货需求枢纽详情页.md`

OLD:

```md
确认分配后，若有采购数量则 `purchasing`，否则 `prepared`。
```

NEW:

```md
确认分配后，若全部明细使用现有库存且库存锁定完成，则进入 `prepared`；若任一明细包含全部采购或部分采购，则进入 `pending_purchase_order`。Story 5.4 不生成采购订单，不得把采购缺口直接标记为 `purchasing`。
```

Add acceptance criteria:

- 发货需求详情页、列表页、销售订单详情关联展示均显示“待生成采购单”状态。
- FlowProgress 在“库存分配”和“采购中”之间显示“待生成采购单”阶段。
- ActivityTimeline 状态变更文案支持 `pending_purchase_order`。
- `confirm-allocation` 单测新增：含采购数量时返回 `pending_purchase_order`，且 `purchaseOrderedQuantity` 仍为 0。

Rationale:

修正已完成 Story 的业务终态，不改变已完成的库存锁定能力。

### Proposal I — Story 5.5 / Logistics Entry

Target: `_bmad-output/implementation-artifacts/5-5-发货需求下游入口与完整作废逻辑.md` and Epic 7 Story 7.1

OLD:

```md
物流单产品明细只预填已锁定且尚未出库的 SKU 与数量。
```

NEW:

```md
物流单产品明细只预填已锁定且尚未被 active 物流单计划的 SKU 与数量。待采购数量、待生成采购单数量、采购中但尚未收货锁定的数量不得进入物流单可计划数量。
```

Rationale:

物流单表单必须消费库存锁定结果，而不是消费采购需求。

### Proposal J — Frontend Status and FlowProgress

Target:

- `apps/web/src/pages/shipping-demands/index.tsx`
- `apps/web/src/pages/shipping-demands/detail.tsx`
- `apps/web/src/pages/shipping-demands/form.tsx`
- `apps/web/src/pages/sales-orders/detail.tsx`
- `apps/web/src/components/ActivityTimeline.tsx`

Required changes:

- 状态筛选新增：`待生成采购单`。
- 状态样式建议：`master-pill-warning` 或橙色，但文案区分于“采购中”。
- FlowProgress 建议步骤：
  1. 需求创建
  2. 分配库存
  3. 待生成采购单
  4. 采购中
  5. 备货完成
  6. 创建物流
  7. 出库发货
  8. 完成
- 若全部走库存，可从“分配库存”直接到“备货完成”。
- 采购 SmartButton：
  - `pending_purchase_order`: 主操作可用，文案“生成采购单”。
  - `purchasing`: 可继续补单，若仍有 `purchaseRequiredQuantity > purchaseOrderedQuantity`。
  - `prepared/partially_shipped/shipped`: 隐藏或仅查看关联采购订单。
- 物流 SmartButton：
  - 只在存在已锁定待发量时可用；状态可以是 `prepared` 或 `partially_shipped`，也可允许 `pending_purchase_order`/`purchasing` 中的部分锁定量创建物流单，但必须由产品确认。MVP 建议沿用当前后端：仅 `prepared` / `partially_shipped` 可创建物流单，降低部分采购期间提前发货复杂度。

Rationale:

用户需要看懂采购单还未生成，且知道下一步动作是“生成采购单”。

## 6. Proposed Sprint / Backlog Changes

### Add Story 5.6: 发货需求待生成采购单状态纠偏

As a 商务跟单,
I want 发货需求在确认分配后准确显示“待生成采购单”,
So that 我不会把尚未创建采购订单的需求误判为已经进入采购执行。

Current implementation scope:

- 只修改已开发的“确认分配后”状态切片。
- 确认分配后如果存在采购数量，发货需求进入 `pending_purchase_order`，不再进入 `purchasing`。
- 不实现采购订单创建，不回填 `purchaseOrderedQuantity`，不实现收货后自动锁定完成推进 `prepared`。

Deferred constraints for future stories:

- Epic 6 Story 6.3 负责采购订单创建成功后的 `purchaseOrderedQuantity` 回填和 `pending_purchase_order -> purchasing`。
- Epic 6 Story 6.6 负责请购型采购收货后 FIFO 自动锁定，以及全部应发数量锁定完成后的 `prepared` 推进。
- 后续创建 Story 6.3 / 6.6 时必须引用本提案和 `_bmad-output/prototypes/shipping-demand-status-flow-prototype.html`。

Acceptance Criteria:

1. `ShippingDemandStatus` 新增 `PENDING_PURCHASE_ORDER = 'pending_purchase_order'`，前后端共同引用。
2. `POST /shipping-demands/:id/confirm-allocation` 在存在采购数量时将发货需求推进为 `pending_purchase_order`，不再直接推进为 `purchasing`。
3. 全部明细使用现有库存且锁定完成时仍推进为 `prepared`。
4. 发货需求列表、详情、编辑页、销售订单关联展示、ActivityTimeline 支持“待生成采购单”文案和状态样式。
5. FlowProgress 在“分配库存”和“采购中”之间新增“待生成采购单”步骤。
6. 发货需求详情页采购 SmartButton 在 `pending_purchase_order` 状态展示“生成采购单”入口；若 Epic 6 页面尚未落地，可保持禁用但文案必须说明“采购订单功能将在 Epic 6 启用”。
7. 单测覆盖：含采购数量确认分配 -> `pending_purchase_order`；全部库存确认分配 -> `prepared`；物流单创建仍不能使用待采购数量。
8. 更新 PRD、flow-state-machine、flow-cross-document-trigger、flow-quantity-data-lineage、Story 5.4、Story 5.5、Epic 6.3、Epic 6.6、Epic 7.1 文档口径；其中 Epic 6.3 / 6.6 仅作为后续 Story AC 约束，不在 5.6 实现。

Suggested sprint-status addition after approval:

```yaml
  5-6-发货需求待生成采购单状态纠偏: backlog
```

Placement:

- Add under Epic 5 after Story 5.5.
- Complete before Epic 6.3 starts.

## 7. Implementation Handoff

Scope classification: Moderate.

Recommended route:

- Product Owner / Developer: approve and add Story 5.6 to sprint-status.
- Developer agent: implement Story 5.6 code and tests, scope limited to confirm-allocation 后状态纠偏和已开发 UI/文档同步。
- Developer agent for Epic 6.3: implement purchase order creation with `purchaseOrderedQuantity` backfill and `pending_purchase_order -> purchasing` transition; Story creation must cite this proposal and the UX prototype.
- Developer agent for Epic 6.6: implement requisition receipt auto-lock and final `prepared` transition; Story creation must cite this proposal and the UX prototype.
- Product/UX reviewer: confirm whether partial locked stock may create logistics orders before all采购到货。MVP recommendation: keep logistics creation gated to `prepared` / `partially_shipped` only.

Implementation sequence:

1. Update planning artifacts and story text.
2. Add shared enum value and update all status mappings.
3. Change `confirm-allocation` state transition and tests.
4. Update frontend labels, filters, FlowProgress, ActivityTimeline.
5. Add/adjust logistics tests proving待采购数量不会进入物流单可计划数量。
6. In Epic 6.3, implement purchase order creation, `purchaseOrderedQuantity` backfill, and state transition to `purchasing`; require the Story 6.3 file to reference this proposal and `_bmad-output/prototypes/shipping-demand-status-flow-prototype.html`.
7. In Epic 6.6, implement requisition receipt FIFO auto-lock and final transition to `prepared`; require the Story 6.6 file to reference this proposal and `_bmad-output/prototypes/shipping-demand-status-flow-prototype.html`.

Success criteria:

- 确认分配后含采购缺口的发货需求显示“待生成采购单”。
- 只有采购订单创建成功后才显示“采购中”。
- `purchaseOrderedQuantity` 准确反映未取消请购型采购订单累计下单数量。
- 可下单数量始终为 `purchaseRequiredQuantity - purchaseOrderedQuantity`。
- 物流单创建只读取已锁定待发数量，不读取待采购数量。
- FlowProgress、列表筛选、详情状态、销售订单关联展示、ActivityTimeline 文案一致。

## 8. Approval

审批状态：Approved。

审批记录：

- 审批人：friday
- 审批时间：2026-04-29
- 审批结论：按 Direct Adjustment 执行，新增 Story 5.6。

## 9. Workflow Completion Log

- Issue addressed: 发货需求确认分配后，含采购数量时不应直接进入“采购中”，应先进入“待生成采购单”。
- Change scope: Moderate。
- Artifacts modified: 本次仅新增并批准 Sprint Change Proposal 文档。
- Routed to: Product Owner / Developer agents。
- Handoff deliverables: Sprint Change Proposal、详细 edit proposals、Story 5.6 backlog reorganization plan、Developer implementation handoff。

Next steps:

1. 将 `5-6-发货需求待生成采购单状态纠偏` 加入 `sprint-status.yaml` 的 Epic 5。
2. 更新 PRD、flow-state-machine、flow-cross-document-trigger、flow-quantity-data-lineage、Story 5.4、Story 5.5、Epic 6.3、Epic 6.6、Epic 7.1 文档口径。
3. 由 Developer agent 实施 Story 5.6：shared enum、后端 `confirm-allocation`、前端状态文案/FlowProgress/ActivityTimeline、测试；不实现采购订单创建或收货后自动锁定。
4. 后续创建 Story 6.3 时必须引用本提案和原型，实现采购订单创建成功后 `pending_purchase_order -> purchasing`，并回填 `purchaseOrderedQuantity`。
5. 后续创建 Story 6.6 时必须引用本提案和原型，实现请购型采购收货后 FIFO 自动锁定，以及全部应发数量锁定完成后推进 `prepared`。

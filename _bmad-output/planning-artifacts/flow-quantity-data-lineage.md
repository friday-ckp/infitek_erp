---
workflowType: architecture-addon
topic: quantity-data-lineage
status: complete
project_name: infitek_erp
user_name: friday
date: '2026-04-27'
baseDocuments:
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/flow-cross-document-trigger.md
  - _bmad-output/planning-artifacts/flow-state-machine.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/5-1-销售订单创建与确认.md
---

# 数量数据流转与回填规则架构补充

> 覆盖范围：Epic 5-7 销售订单、发货需求、采购订单、收货入库、物流单、发货出库、库存双层结构。
> 本文以 2026-04-26 已确定的 `flow-cross-document-trigger.md` 和 `flow-state-machine.md` 为准。

---

## 1. 目标与边界

### 1.1 目标

后续交易模块实现时，所有数量字段必须有明确的权威来源、更新事件、事务边界和幂等规则，避免出现以下问题：

- 发货需求、采购、收货、出库各自维护数量，互相不一致。
- 重复点击确认导致数量重复累加。
- 部分收货、部分发货后状态正确但明细数量错误。
- 库存锁定释放后，销售订单明细仍显示旧数量。
- 同一 SKU 拆分为采购和现有库存时，回填口径不清。

### 1.2 与既有文档的关系

已有文档负责：

| 文档 | 负责内容 |
|---|---|
| `flow-cross-document-trigger.md` | 单据之间何时触发、触发后进入哪个阶段 |
| `flow-state-machine.md` | 各单据状态机 |
| `architecture.md` | 技术栈、事务、库存行锁、模块边界 |
| 本文 | 数量字段的权威来源、回填规则、幂等和一致性约束 |

### 1.3 最新流程决策

若旧 PRD、旧 Epic 或旧实现说明与以下规则冲突，以本节为准：

- 销售订单审核通过后，由用户在详情页手动触发生成发货需求，不在审核通过时自动生成。
- 发货需求是履约数量的权威单据。销售订单明细只保留订单签约数量和汇总展示数量。
- 库存数量的权威来源是库存双层结构和库存流水，不是任何业务单据明细字段。
- 状态推进由数量聚合结果触发，不允许前端直接提交目标状态。

---

## 2. 核心架构决策

### 2.1 按生命周期划分数量权威来源

| 生命周期阶段 | 权威来源 | 说明 |
|---|---|---|
| 客户下单数量 | `sales_order_items.quantity` | 销售订单签约数量，创建后作为上游需求基准。 |
| 履约决策数量 | `shipping_demand_items` | 发货需求明细决定多少走现有库存、多少走采购。 |
| 库存锁定数量 | `shipping_demand_inventory_allocations` + `inventory_batch.batch_locked_quantity` | 精确到发货需求明细、仓库、批次。 |
| 采购数量 | `purchase_order_items.quantity` | 请购型采购行必须关联 `shipping_demand_item_id`。 |
| 收货数量 | `receipt_items.received_quantity` | 收货确认后创建库存批次。 |
| 物流计划数量 | `logistics_order_items.planned_quantity` | 只能来自已锁定且未计划出运的数量。 |
| 出库数量 | `outbound_order_items.outbound_quantity` | 出库确认后扣实际库存并释放锁定量。 |
| 当前库存数量 | `inventory_summary` + `inventory_batch` | 汇总层和批次层必须保持一致。 |
| 数量审计 | `inventory_transactions` + 操作审计日志 | 所有库存变更只追加流水。 |

### 2.2 销售订单明细不是履约过程的写入入口

Story 5.1 当前已在 `sales_order_items` 中落地：

- `purchase_quantity`
- `use_stock_quantity`
- `prepared_quantity`
- `shipped_quantity`

后续实现不得把这些字段作为履约流程的权威来源。建议处理方式：

| 字段 | 后续口径 |
|---|---|
| `quantity` | 保留，作为销售订单签约数量的权威来源。 |
| `purchase_quantity` | 只作为汇总展示缓存，来源于所有有效发货需求明细的 `purchase_required_quantity`。 |
| `use_stock_quantity` | 只作为汇总展示缓存，来源于所有有效发货需求明细的 `stock_required_quantity`。 |
| `prepared_quantity` | 只作为汇总展示缓存，口径为 `locked_remaining_quantity + shipped_quantity`。 |
| `shipped_quantity` | 只作为汇总展示缓存，来源于所有有效发货需求明细的累计出库数量。 |

规则：

- 创建或编辑销售订单时，不允许前端传入上述 4 个履约数量字段来驱动下游。
- 发货需求、收货、出库事件完成后，由后端聚合器统一回填这些展示缓存。
- 若后续迁移允许调整表结构，可将这 4 个字段改名为 `*_snapshot` 或以详情接口动态聚合替代。

### 2.3 使用“分配表”表达锁定，而不是只在明细上写一个总数

库存锁定必须记录到批次级别，否则无法正确处理：

- FIFO 跨批次锁定。
- 发货需求作废释放。
- 按仓库出库校验。
- 部分发货后释放对应批次锁定量。

新增建议实体：

```text
shipping_demand_inventory_allocations
```

核心字段：

| 字段 | 说明 |
|---|---|
| `shipping_demand_id` | 发货需求 ID。 |
| `shipping_demand_item_id` | 发货需求明细 ID。 |
| `sales_order_item_id` | 上游销售订单明细 ID，便于回填。 |
| `sku_id` | SKU ID。 |
| `warehouse_id` | 仓库 ID。 |
| `inventory_batch_id` | 被锁定的库存批次 ID。 |
| `lock_source` | `existing_stock` 或 `purchase_receipt`。 |
| `source_document_type` | 来源单据类型，如 `shipping_demand`、`receipt_order`。 |
| `source_document_id` | 来源单据 ID。 |
| `locked_quantity` | 当前仍锁定、尚未出库的数量。 |
| `shipped_quantity` | 已从该分配出库的数量。 |
| `released_quantity` | 已释放但未出库的数量。 |
| `status` | `active`、`released`、`shipped`。 |

约束：

- `locked_quantity >= 0`
- `shipped_quantity >= 0`
- `released_quantity >= 0`
- `locked_quantity + shipped_quantity + released_quantity = original_locked_quantity`
- 出库只允许消费 `status = active` 且 `locked_quantity > 0` 的分配记录。

### 2.4 库存流水记录实际量与锁定量的变化

`inventory_transactions` 不应只记录一个 `quantity_change`，应明确记录实际库存和锁定库存的变化：

| 字段 | 说明 |
|---|---|
| `actual_quantity_delta` | 实际库存变化，入库为正，出库为负，锁定/解锁为 0。 |
| `locked_quantity_delta` | 锁定量变化，锁定为正，解锁/出库为负，入库为 0。 |
| `available_quantity_delta` | 可用库存变化，可由前两者推导，也可存快照便于审计。 |
| `before_actual_quantity` / `after_actual_quantity` | 操作前后实际库存。 |
| `before_locked_quantity` / `after_locked_quantity` | 操作前后锁定量。 |
| `source_action_key` | 幂等键，防止同一确认事件重复记账。 |

变化口径：

| 事件 | 实际库存变化 | 锁定量变化 | 可用库存变化 |
|---|---:|---:|---:|
| 期初录入增加 | `+N` | `0` | `+N` |
| 采购入库 | `+N` | `0` | `+N` |
| 锁定库存 | `0` | `+N` | `-N` |
| 释放锁定 | `0` | `-N` | `+N` |
| 发货出库 | `-N` | `-N` | `0` |

### 2.5 所有数量变化必须由领域动作服务触发

禁止任何模块直接 `save()` 或 `update()` 库存数量字段。

| 动作 | 服务入口 |
|---|---|
| 生成发货需求 | `ShippingDemandsService.generateFromSalesOrder()` |
| 确认库存分配 | `ShippingDemandsService.confirmFulfillment()` |
| 发货需求作废 | `ShippingDemandsService.voidDemand()` |
| 创建请购型采购订单 | `PurchaseOrdersService.createFromShippingDemand()` |
| 确认收货 | `ReceiptOrdersService.confirmReceipt()` |
| 创建物流单 | `LogisticsOrdersService.createFromShippingDemand()` |
| 确认出库 | `OutboundOrdersService.confirmOutbound()` |
| 库存锁定/释放/扣减/入库 | 统一委托 `InventoryService` |

所有动作服务必须：

1. 开启 TypeORM `QueryRunner` 事务。
2. 锁定相关父单据行。
3. 调用 `InventoryService` 完成库存行锁与批次行锁。
4. 写入库存流水和操作审计。
5. 重新聚合上游数量缓存。
6. 重新评估状态机。
7. 提交事务。

---

## 3. 推荐实体与字段

### 3.1 发货需求主表

`shipping_demands`

| 字段 | 说明 |
|---|---|
| `demand_code` | 发货需求编号。 |
| `sales_order_id` | 来源销售订单。 |
| `status` | `pending_allocation`、`purchasing`、`prepared`、`partially_shipped`、`shipped`、`voided`。 |
| `voided_at` / `voided_by` | 作废审计字段。 |

约束：

- 同一销售订单同一时间只允许存在一个非作废的发货需求。
- MySQL 无部分唯一索引时，需在服务层事务内 `SELECT ... FOR UPDATE` 锁定销售订单，再检查是否已有 active demand。

### 3.2 发货需求明细

`shipping_demand_items`

| 字段 | 权威/缓存 | 说明 |
|---|---|---|
| `shipping_demand_id` | 权威 | 发货需求 ID。 |
| `sales_order_item_id` | 权威 | 来源销售订单明细 ID。 |
| `sku_id` | 权威 | SKU ID。 |
| `required_quantity` | 权威 | 应发数量，生成时来自 `sales_order_items.quantity`。 |
| `available_stock_snapshot` | 快照 | 生成时的可用库存，只用于展示当时判断依据。 |
| `fulfillment_type` | 权威 | `purchase_all`、`purchase_partial`、`use_stock`。 |
| `stock_required_quantity` | 权威 | 本明细计划使用现有库存的数量。 |
| `purchase_required_quantity` | 权威 | 本明细计划采购的数量。 |
| `locked_remaining_quantity` | 缓存 | 当前已锁定但未出库数量，来源于分配表。 |
| `shipped_quantity` | 缓存 | 累计已出库数量，来源于出库单。 |
| `purchase_ordered_quantity` | 缓存 | 未取消采购订单累计下单数量。 |
| `received_quantity` | 缓存 | 请购型采购累计收货数量。 |

核心不变量：

```text
required_quantity = stock_required_quantity + purchase_required_quantity
locked_remaining_quantity + shipped_quantity <= required_quantity
shipped_quantity <= required_quantity
```

状态判断口径：

```text
prepared_quantity = locked_remaining_quantity + shipped_quantity
is_prepared = prepared_quantity = required_quantity
is_shipped = shipped_quantity = required_quantity
```

### 3.3 采购订单明细

`purchase_order_items`

| 字段 | 说明 |
|---|---|
| `purchase_order_id` | 采购订单 ID。 |
| `shipping_demand_id` | 请购型采购订单必填，备货型为空。 |
| `shipping_demand_item_id` | 请购型采购行必填，备货型为空。 |
| `sku_id` | SKU ID。 |
| `quantity` | 采购数量。 |
| `received_quantity` | 累计收货数量缓存。 |
| `cancelled_quantity` | 取消数量，MVP 可由整单取消推导。 |

创建请购型采购订单时：

```text
可下单数量 = purchase_required_quantity - purchase_ordered_quantity
```

取消采购订单时：

- 不回退发货需求状态。
- 从 `purchase_ordered_quantity` 聚合中排除该采购订单。
- 用户可在发货需求详情页继续补单。

### 3.4 收货入库明细

`receipt_items`

| 字段 | 说明 |
|---|---|
| `receipt_order_id` | 收货入库单 ID。 |
| `purchase_order_item_id` | 来源采购订单明细。 |
| `shipping_demand_item_id` | 请购型收货可从采购明细继承。 |
| `sku_id` | SKU ID。 |
| `warehouse_id` | 目标仓库。 |
| `received_quantity` | 实收数量。 |
| `inventory_batch_id` | 确认后创建的库存批次。 |

### 3.5 物流单明细

`logistics_order_items`

| 字段 | 说明 |
|---|---|
| `logistics_order_id` | 物流单 ID。 |
| `shipping_demand_item_id` | 来源发货需求明细。 |
| `sku_id` | SKU ID。 |
| `planned_quantity` | 本次物流计划发货数量。 |
| `outbound_quantity` | 累计已出库数量缓存。 |

创建物流单时：

```text
可计划数量 = locked_remaining_quantity - active_logistics_planned_quantity
```

不允许物流计划数量超过当前已锁定且尚未被其他未完成物流单占用的数量。

### 3.6 出库明细与分配消费

`outbound_order_items`

| 字段 | 说明 |
|---|---|
| `outbound_order_id` | 出库单 ID。 |
| `logistics_order_item_id` | 来源物流单明细。 |
| `shipping_demand_item_id` | 来源发货需求明细。 |
| `sku_id` | SKU ID。 |
| `warehouse_id` | 出库仓库。 |
| `outbound_quantity` | 实际出库数量。 |

建议新增：

```text
outbound_allocation_consumptions
```

用于记录一次出库消耗了哪些锁定分配：

| 字段 | 说明 |
|---|---|
| `outbound_order_item_id` | 出库明细 ID。 |
| `allocation_id` | 发货需求库存分配 ID。 |
| `inventory_batch_id` | 库存批次 ID。 |
| `consumed_quantity` | 本次消耗数量。 |

这样才能审计“哪一批锁定库存最终被哪张出库单发走”。

---

## 4. 业务事件影响矩阵

### 4.1 销售订单审核通过

| 项 | 规则 |
|---|---|
| 前置状态 | 销售订单 `in_review`。 |
| 数量影响 | 无库存影响，不创建发货需求。 |
| 状态影响 | 销售订单 -> `approved`。 |
| 后续入口 | 订单详情页展示“生成发货需求”。 |

### 4.2 手动生成发货需求

| 项 | 规则 |
|---|---|
| 前置状态 | 销售订单 `approved`，且不存在非作废发货需求。 |
| 创建 | `shipping_demands` + `shipping_demand_items`。 |
| 数量来源 | `shipping_demand_items.required_quantity = sales_order_items.quantity`。 |
| 快照 | 查询库存可用量，写入 `available_stock_snapshot`。 |
| 库存影响 | 无锁定、无扣减。 |
| 状态影响 | 销售订单 -> `preparing`，发货需求 -> `pending_allocation`。 |
| 幂等 | 事务内锁销售订单，重复触发返回已存在发货需求，不创建第二张 active demand。 |

### 4.3 确认库存分配

| 项 | 规则 |
|---|---|
| 前置状态 | 发货需求 `pending_allocation`。 |
| 校验 | 每行必须设置履行类型。 |
| 数量拆分 | `required_quantity = stock_required_quantity + purchase_required_quantity`。 |
| 现有库存 | 对 `stock_required_quantity` 执行 FIFO 锁定。 |
| 采购部分 | 不锁库存，等待请购型采购收货后自动锁定。 |
| 库存影响 | 批次 `batch_locked_quantity +N`，汇总 `locked_quantity +N`，`available_quantity -N`。 |
| 分配记录 | 写入 `shipping_demand_inventory_allocations`。 |
| 流水 | `change_type = lock`。 |
| 状态影响 | 若无采购部分且全部锁定 -> 发货需求 `prepared`、销售订单 `prepared`；否则发货需求 `purchasing`。 |
| 幂等 | 发货需求已离开 `pending_allocation` 后，重复提交应返回业务错误或当前结果，不得再次锁定。 |

### 4.4 创建请购型采购订单

| 项 | 规则 |
|---|---|
| 前置状态 | 发货需求 `purchasing`。 |
| 行范围 | 只允许 `purchase_required_quantity > purchase_ordered_quantity` 的发货需求明细。 |
| 数量上限 | `本次采购数量 <= purchase_required_quantity - purchase_ordered_quantity`。 |
| 状态影响 | 采购订单按最新状态机创建为 `pending_confirm`，后续经内部确认/供应商确认推进至 `supplier_confirming` / `pending_receipt`。发货需求不回退。 |
| 回填 | 聚合更新 `shipping_demand_items.purchase_ordered_quantity` 和销售订单展示缓存。 |
| 幂等 | 批量创建时使用请求批次号或动作键，避免重复点击生成重复 PO。 |

### 4.5 采购订单取消

| 项 | 规则 |
|---|---|
| 前置状态 | 采购订单允许取消的状态。 |
| 数量影响 | 不影响库存，因为采购未收货不产生库存。 |
| 发货需求状态 | 不回退，仍停留在 `purchasing`。 |
| 回填 | 从未取消采购订单重新聚合 `purchase_ordered_quantity`。 |
| 后续 | 用户从发货需求详情页补单。 |

### 4.6 收货确认

| 项 | 规则 |
|---|---|
| 前置状态 | 收货单未确认，采购订单处于可收货状态。 |
| 入库 | 每行创建 `inventory_batch`，汇总层 `actual_quantity +N`，`available_quantity +N`。 |
| 请购型自动锁定 | 若采购行关联发货需求明细，则从本次收货批次按入库日期、批次 ID 顺序锁定至对应发货需求。 |
| 备货型 | 仅增加实际库存，不自动锁定。 |
| 超收 | MVP 默认不允许超过采购行剩余未收数量；如业务允许超收，需单独产品决策。 |
| 部分收货 | 允许。采购订单状态按 `received_quantity` 与 `quantity` 聚合为 `partially_received` 或 `received`。 |
| 回填 | 更新采购行 `received_quantity`、发货需求明细 `received_quantity`、`locked_remaining_quantity`。 |
| 状态影响 | 若发货需求所有明细 `locked_remaining_quantity + shipped_quantity = required_quantity`，发货需求 -> `prepared`，销售订单 -> `prepared`。 |
| 幂等 | 收货单确认只能执行一次；`source_action_key = receipt:{id}:confirm` 唯一。 |

### 4.7 创建物流单

| 项 | 规则 |
|---|---|
| 前置状态 | 发货需求 `prepared` 或 `partially_shipped` 且存在可计划锁定数量。 |
| 数量上限 | `planned_quantity <= locked_remaining_quantity - active_logistics_planned_quantity`。 |
| 库存影响 | 无。物流单只占用已经锁定给该发货需求的数量，不再次锁库存。 |
| 状态影响 | 物流单创建即 `confirmed`。发货需求状态不因创建物流单改变。 |
| 回填 | 聚合 `active_logistics_planned_quantity`，用于防止多张物流单重复计划同一锁定量。 |

### 4.8 出库确认

| 项 | 规则 |
|---|---|
| 前置状态 | 出库单未确认，物流单 `confirmed`。 |
| 校验 | 每行出库数量不得超过该发货需求明细在该仓库的 `locked_quantity`。 |
| 分配消费 | 按该发货需求明细的 active allocation FIFO 消费。 |
| 库存影响 | 批次 `batch_quantity -N`、`batch_locked_quantity -N`；汇总 `actual_quantity -N`、`locked_quantity -N`；`available_quantity` 保持由公式计算。 |
| 流水 | `change_type = outbound`，`actual_quantity_delta = -N`，`locked_quantity_delta = -N`。 |
| 回填 | 更新 allocation、发货需求明细 `locked_remaining_quantity`、`shipped_quantity`、物流明细 `outbound_quantity`、销售订单明细 `shipped_quantity` 缓存。 |
| 状态影响 | 物流单全部出库 -> `shipped`；发货需求部分出库 -> `partially_shipped`；全部出库 -> `shipped`；销售订单按所有 active demand 聚合为 `partially_shipped` 或 `shipped`。 |
| 幂等 | 出库单确认只能执行一次；`source_action_key = outbound:{id}:confirm` 唯一。 |

### 4.9 发货需求作废

| 项 | 规则 |
|---|---|
| 前置状态 | 仅允许 `pending_allocation`。 |
| 库存影响 | 正常情况下无锁定；若存在历史或异常锁定记录，必须释放 active allocation。 |
| 回填 | 销售订单明细展示缓存从 active demand 重新聚合。 |
| 状态影响 | 发货需求 -> `voided`；销售订单 -> `approved`。 |
| 后续 | 销售订单详情页展示“重新生成发货需求”。 |
| 幂等 | 已作废再次作废直接返回当前结果，不重复释放。 |

---

## 5. 状态聚合规则

### 5.1 发货需求状态

| 目标状态 | 判定条件 |
|---|---|
| `pending_allocation` | 已生成但尚未确认库存分配。 |
| `purchasing` | 已确认分配，但仍存在 `locked_remaining_quantity + shipped_quantity < required_quantity` 的明细。 |
| `prepared` | 所有明细 `locked_remaining_quantity + shipped_quantity = required_quantity`，且尚未出库完成。 |
| `partially_shipped` | 任一明细 `shipped_quantity > 0`，且并非全部发完。 |
| `shipped` | 所有明细 `shipped_quantity = required_quantity`。 |
| `voided` | 作废终态。 |

### 5.2 销售订单状态

| 目标状态 | 判定条件 |
|---|---|
| `approved` | 审核通过，且不存在 active demand；或 active demand 作废后回退。 |
| `preparing` | 已生成 active demand，但尚未全部备货完成。 |
| `prepared` | 所有 active demand 明细均满足 `locked_remaining_quantity + shipped_quantity = required_quantity`，且尚未出库。 |
| `partially_shipped` | 任一 active demand 明细已出库，且并非全部发完。 |
| `shipped` | 所有 active demand 明细全部出库。 |

### 5.3 采购订单状态

以 `purchase_order_items.received_quantity` 聚合：

| 目标状态 | 判定条件 |
|---|---|
| `pending_receipt` | 已供应商确认但无收货。 |
| `partially_received` | `0 < received_quantity < quantity` 的任一行存在。 |
| `received` | 所有行 `received_quantity >= quantity`。 |
| `cancelled` | 取消终态。 |

### 5.4 物流单状态

| 目标状态 | 判定条件 |
|---|---|
| `confirmed` | 创建即确认，等待出库。 |
| `shipped` | 所有物流明细 `outbound_quantity = planned_quantity`。 |
| `delivered` | 手动更新送达。 |
| `cancelled` | 取消终态。 |

---

## 6. 共享枚举同步要求

后续实现 Epic 5-7 前，必须先同步 `packages/shared` 的状态枚举。当前代码中的部分交易枚举仍是占位口径，不能直接沿用。

| 枚举 | 目标值 |
|---|---|
| `SalesOrderStatus` | 已包含 `approved`、`preparing`、`prepared`、`partially_shipped`、`shipped`、`voided`，后续需继续沿用。 |
| `ShippingDemandStatus` | `pending_allocation`、`purchasing`、`prepared`、`partially_shipped`、`shipped`、`voided`。 |
| `PurchaseOrderStatus` | `pending_confirm`、`supplier_confirming`、`pending_receipt`、`partially_received`、`received`、`cancelled`。 |
| `LogisticsOrderStatus` | `confirmed`、`shipped`、`delivered`、`cancelled`。 |

规则：

- 枚举必须定义在 `packages/shared`，前后端共同引用。
- 状态展示中文文案只在 UI 映射层处理，数据库和 API 使用上述英文值。
- 若旧 Story 中出现 `处理中`、`已发运`、`待出库`、`已出库` 等旧口径，需按本文和 `flow-state-machine.md` 映射后实现。

---

## 7. 事务、锁顺序与幂等

### 7.1 事务边界

以下动作必须是一个数据库事务：

- 生成发货需求。
- 确认库存分配。
- 发货需求作废。
- 批量创建请购型采购订单。
- 收货确认。
- 出库确认。
- 采购订单取消。
- 物流单取消。

事务失败时，不能留下半完成状态。例如收货确认如果库存批次创建成功但自动锁定失败，整笔收货必须回滚。

### 7.2 锁顺序

为降低死锁概率，所有交易模块按固定顺序加锁：

1. 上游父单据：`sales_orders`
2. 枢纽单据：`shipping_demands`
3. 当前动作单据：`purchase_orders` / `receipt_orders` / `logistics_orders` / `outbound_orders`
4. 明细行，按主键升序
5. `inventory_summary`，按 `sku_id, warehouse_id` 升序
6. `inventory_batch`，按 `receipt_date, id` 升序
7. 分配表 `shipping_demand_inventory_allocations`，按 `id` 升序

库存写操作继续遵守既有架构规则：

- TypeORM `QueryRunner`
- `SELECT ... FOR UPDATE`
- MySQL 死锁 Error 1213 指数退避最多 3 次
- 超限抛 `ConflictException({ code: 'CONCURRENT_UPDATE' })`

### 7.3 幂等键

每个会改变数量的确认动作必须有唯一幂等键。

| 动作 | 幂等键 |
|---|---|
| 生成发货需求 | `sales-order:{salesOrderId}:generate-shipping-demand:{activeGenerationNo}` |
| 确认库存分配 | `shipping-demand:{shippingDemandId}:confirm-fulfillment` |
| 作废发货需求 | `shipping-demand:{shippingDemandId}:void` |
| 收货确认 | `receipt:{receiptOrderId}:confirm` |
| 出库确认 | `outbound:{outboundOrderId}:confirm` |

实现方式：

- 库存流水 `source_action_key` 加唯一索引。
- 或新增 `document_quantity_events` 表，字段包含 `action_key`、`document_type`、`document_id`、`status`、`created_at`。
- 进入动作前先尝试写入事件记录；唯一键冲突时返回已完成结果或提示重复提交。

---

## 8. 回填聚合器

建议新增内部服务：

```text
QuantityProjectionService
```

职责：

| 方法 | 说明 |
|---|---|
| `refreshShippingDemandItemQuantities(demandItemIds)` | 从分配表、采购行、收货行、出库行聚合发货需求明细缓存。 |
| `refreshSalesOrderItemQuantities(salesOrderItemIds)` | 从 active demand 聚合销售订单明细展示缓存。 |
| `refreshPurchaseOrderItemQuantities(poItemIds)` | 从收货明细聚合采购订单收货数量。 |
| `refreshLogisticsOrderItemQuantities(logisticsItemIds)` | 从出库明细聚合物流单出库数量。 |
| `recomputeDocumentStatuses(rootDocumentIds)` | 从数量聚合结果推进状态机。 |

调用规则：

- 只能在动作事务内调用。
- 只负责从权威数据重算缓存，不接受前端传入的目标数量。
- 对同一批 ID 必须使用确定性排序，避免锁顺序不稳定。

---

## 9. 后续 Story 落地要求

### 9.1 Story 5.2 / 5.3 / 5.4

- 生成发货需求时创建 `shipping_demand_items`，并写入 `sales_order_item_id`。
- 发货需求详情页展示的“已锁定数量、已出库数量”来自发货需求明细聚合，不直接读销售订单明细。
- 确认分配接口一次性提交所有明细的履行类型和数量拆分。
- 确认分配后不允许通过通用 PATCH 修改履行数量。

### 9.2 Story 5.5

- 作废只允许 `pending_allocation`。
- 作废后销售订单回到 `approved`。
- 若释放了锁定库存，必须写 `unlock` 库存流水。
- 重新生成发货需求必须生成新单据，旧作废单据保留审计。

### 9.3 Story 6.1 / 6.2

- `inventory_summary.available_quantity` 如采用存储字段，必须在事务内维护；如采用查询计算，所有响应字段仍统一输出 `availableQuantity`。
- `inventory_batch` 必须支持批次级锁定量。
- 库存流水必须能表达实际量变化和锁定量变化。

### 9.4 Story 6.3 / 6.6

- 请购型采购订单明细必须关联 `shipping_demand_item_id`。
- 收货确认后，请购型只自动锁定到对应发货需求，不抢占其他需求。
- 部分收货只锁定实收数量，发货需求保持 `purchasing`，直到全部需求数量已锁定。

### 9.5 Story 7.1 / 7.3 / 7.4

- 创建物流单必须校验“未被其他 active 物流单计划的锁定数量”。
- 出库确认必须消费具体 allocation，并写 `outbound_allocation_consumptions`。
- 发货需求、销售订单状态由出库数量聚合后自动推进。

---

## 10. 验收测试矩阵

### 10.1 端到端数量场景

| 场景 | 期望 |
|---|---|
| 订单 20，全走现有库存，确认分配后锁定 20 | 发货需求 `prepared`，销售订单 `prepared`，库存 actual 不变、locked +20、available -20。 |
| 订单 20，现有库存 5，采购 15 | 确认分配后 locked 5，发货需求 `purchasing`。 |
| 上述采购先收 10 | actual +10，自动锁定 +10，发货需求仍 `purchasing`。 |
| 再收 5 | actual +5，自动锁定 +5，发货需求 `prepared`，销售订单 `prepared`。 |
| 先出库 12 | actual -12，locked -12，发货需求 `partially_shipped`，销售订单 `partially_shipped`。 |
| 再出库 8 | 发货需求 `shipped`，销售订单 `shipped`。 |
| 作废待分配发货需求 | 发货需求 `voided`，销售订单回 `approved`，可重新生成。 |

### 10.2 幂等与并发测试

| 测试 | 断言 |
|---|---|
| 重复点击确认分配 | 只产生一组 allocation 和一组 lock 流水。 |
| 重复确认收货 | 只创建一次库存批次和一次采购入库流水。 |
| 重复确认出库 | 只扣减一次实际库存和锁定量。 |
| 10 并发锁定同一 SKU+仓库 | 不超锁，summary 与 batch 汇总一致。 |
| 出库数量超过本需求锁定量 | 返回业务错误，提示当前本需求锁定数量。 |
| 收货后自动锁定遇到死锁 | 最多重试 3 次，失败返回 `CONCURRENT_UPDATE`。 |

### 10.3 数据一致性巡检 SQL 目标

后续可增加管理脚本或测试断言，检查：

```text
inventory_summary.actual_quantity = sum(inventory_batch.batch_quantity)
inventory_summary.locked_quantity = sum(inventory_batch.batch_locked_quantity)
inventory_summary.available_quantity = actual_quantity - locked_quantity
shipping_demand_items.locked_remaining_quantity = sum(active allocations.locked_quantity)
shipping_demand_items.shipped_quantity = sum(outbound_order_items.outbound_quantity)
sales_order_items.shipped_quantity = sum(active demand items.shipped_quantity)
```

---

## 11. 实现禁区

- 禁止前端直接提交 `prepared_quantity`、`shipped_quantity` 作为事实。
- 禁止用通用 PATCH 修改状态字段或履约数量字段。
- 禁止绕过 `InventoryService` 直接更新 `inventory_summary` 或 `inventory_batch`。
- 禁止只在发货需求明细写 `locked_quantity` 而不记录批次 allocation。
- 禁止收货成功但自动锁定失败仍提交事务。
- 禁止出库时只扣实际库存、不释放锁定量。
- 禁止采购订单取消后自动回退发货需求状态。
- 禁止发货需求作废删除旧单据；必须保留作废记录用于审计。

---

## 12. 交接说明

后续 AI Agent 开发 Epic 5-7 时，必须优先引用本文处理数量字段。若 Story 文本与本文冲突：

1. 流程和状态以 `flow-cross-document-trigger.md`、`flow-state-machine.md` 为准。
2. 数量权威来源、回填和事务规则以本文为准。
3. 旧 PRD / 旧 Epic 中“创建即确认”“自动生成发货需求”“处理中/已发运”等旧口径需按最新流程修正后再实现。

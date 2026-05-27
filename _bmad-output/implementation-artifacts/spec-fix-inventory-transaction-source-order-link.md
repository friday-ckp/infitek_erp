---
title: '修复库存变动流水来源单号显示与跳转'
type: 'bugfix'
created: '2026-05-27'
status: 'done'
baseline_commit: '20661e066e38bfd59677f7b4f5af220f60d6f333'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** 库存变动流水列表中的“来源单据”目前显示为 `sourceDocumentType #id`，没有展示业务可识别的具体订单号；除发货需求外也不能点击进入对应详情页，导致库存追溯链路断裂。

**Approach:** 后端库存流水查询返回每条流水对应的来源单据编码、详情路径和中文类型标签；前端库存流水列表使用该显示信息渲染可点击订单号，并对无详情页的期初库存保留只读文本。

## Boundaries & Constraints

**Always:** 保持库存流水分页、筛选和排序行为不变；批量解析当前页来源单据，避免逐行请求；支持现有来源类型 `opening_inventory`、`shipping_demand`、`receipt_order`、`outbound_order`，并兼容可能出现的 `sales_order`、`purchase_order`、`logistics_order`。

**Ask First:** 如果需要新增数据库列、改变库存流水写入来源语义、或调整订单详情路由结构，先暂停并确认。

**Never:** 不改库存变动写入逻辑、不回填历史数据、不用前端硬拼数据库 ID 伪装订单号、不为了本 bug 重构库存模块。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 来源为收货单 | `sourceDocumentType=receipt_order`, `sourceDocumentId=800`，收货单编码 `RO202605270001` | 列表显示 `收货单 RO202605270001`，点击进入 `/receipt-orders/800` | 如果单据查不到，显示 `收货单 #800`，不提供链接 |
| 来源为发货需求 | `sourceDocumentType=shipping_demand`, `sourceDocumentId=500`，需求编码 `SD202605270001` | 列表显示 `发货需求 SD202605270001`，点击进入 `/shipping-demands/500` | 如果单据查不到，显示 `发货需求 #500`，不提供链接 |
| 来源为出库单 | `sourceDocumentType=outbound_order`, `sourceDocumentId=700`，出库单编码 `OUT202605270001` | 列表显示 `出库单 OUT202605270001`，点击进入 `/outbound-orders/700` | 如果单据查不到，显示 `出库单 #700`，不提供链接 |
| 来源为期初库存 | `sourceDocumentType=opening_inventory` | 列表显示 `期初库存 #<id>` | 无详情路由，不提供链接 |

</frozen-after-approval>

## Code Map

- `apps/api/src/modules/inventory/inventory.repository.ts` -- 库存流水分页查询和数据库访问层，适合批量解析来源单据编码。
- `apps/api/src/modules/inventory/inventory.service.ts` -- API 返回 DTO 组装位置，需要扩展来源单据显示字段。
- `apps/api/src/modules/inventory/tests/inventory.service.spec.ts` -- 库存服务单测，覆盖来源单据显示字段映射和兜底。
- `apps/web/src/api/inventory.api.ts` -- 前端库存流水 API 类型定义。
- `apps/web/src/pages/inventory/transactions.tsx` -- 独立“库存变动流水”列表页来源单据列。
- `apps/web/src/pages/inventory/index.tsx` -- 库存总览页内嵌流水表来源单据列。

## Tasks & Acceptance

**Execution:**
- [x] `apps/api/src/modules/inventory/inventory.repository.ts` -- 新增当前页来源单据批量解析能力，按来源类型查询对应实体编码和详情路径所需 ID。
- [x] `apps/api/src/modules/inventory/inventory.service.ts` -- 在 `InventoryTransactionItem` 中返回 `sourceDocumentCode/sourceDocumentLabel/sourceDocumentPath`，查不到来源单据时使用中文类型 + `#id` 兜底。
- [x] `apps/api/src/modules/inventory/tests/inventory.service.spec.ts` -- 增加/更新 `findTransactions` 测试，验证收货单编码链接信息与缺失来源兜底。
- [x] `apps/web/src/api/inventory.api.ts` -- 补齐新增字段类型。
- [x] `apps/web/src/pages/inventory/transactions.tsx` 和 `apps/web/src/pages/inventory/index.tsx` -- 来源单据列显示具体编码并按后端返回路径跳转。

**Acceptance Criteria:**
- Given 库存流水来源于收货单/发货需求/出库单, when 打开库存变动流水列表, then 来源单据列展示对应业务单号而不是 `type #id`。
- Given 来源单据返回了详情路径, when 用户点击来源单号, then 前端进入对应详情页。
- Given 来源单据记录已缺失或来源类型没有详情页, when 渲染列表, then 页面显示可识别兜底文本且不出现错误链接。

## Verification

**Commands:**
- `pnpm --filter @infitek/api test -- inventory.service.spec.ts --runInBand` -- expected: 库存服务单测通过。
- `pnpm --filter @infitek/web build` -- expected: 前端类型检查和构建通过。

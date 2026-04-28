# Sprint Change Proposal: Story 5.4 发货需求枢纽详情页纠偏

Date: 2026-04-28
Project: infitek_erp
Owner: friday

## 1. Issue Summary

Story 5.4 已实现并提交为“发货需求详情字段补齐 + 只读枢纽展示”，但与 `_bmad-output/planning-artifacts/epics.md` 中 Story 5.4 的原验收标准存在偏差。Epic 5.4 要求“含完整库存锁定”：用户应能在发货需求详情页为每个 SKU 设置履行类型，集中确认分配，并由系统按 FIFO 锁定库存。

发现证据：

- 当前实现的 story 文件在 `Scope Adjustment` 中主动排除了库存写操作、确认分配、采购/物流/出库创建。
- 当前前端只读展示 `fulfillmentType`，没有履行类型选择器、内联仓库/批次分配区和“确认分配”按钮。
- 当前后端 `ShippingDemandsController` 仅提供列表、详情、从销售订单生成接口，缺少确认分配动作端点。
- 库存模块已有 `InventoryService.lockStockInTransaction()`、FIFO 批次锁定、库存汇总刷新、并发重试能力；因此不应继续把 5.4 缩减为只读详情。

问题类型：对原 Story 5.4 范围的误解和实现收窄，需要在当前 sprint 中纠偏。

## 2. Impact Analysis

### Epic Impact

Epic 5 仍可按原计划完成，无需新增 Epic 或重新排序。当前实现可保留为 Story 5.4 的第一部分：销售订单镜像字段、附件 URL、FlowProgress、SmartButton 占位、KPI 和产品明细展示。

需要补齐的 Epic 5.4 验收点：

- 产品明细行履行类型选择器。
- “使用现有库存 / 部分采购”对应的库存使用数量确认。
- 页面底部或顶部操作区“确认分配”按钮。
- 后端确认分配动作端点。
- FIFO 锁定库存，写入发货需求库存分配记录。
- 更新发货需求明细 `stock_required_quantity`、`purchase_required_quantity`、`locked_remaining_quantity`。
- 根据分配结果将发货需求状态推进为 `purchasing` 或 `prepared`。
- 刷新详情页 InventoryIndicator 和 KPI。
- ActivityTimeline 记录确认分配/库存锁定事件。

Story 5.5、Epic 6、Epic 7 依赖本次补齐后的库存分配结果，尤其是后续采购、物流计划、出库确认要消费 `shipping_demand_inventory_allocations`。

### Artifact Conflicts

- PRD：不需要修改。FR26、FR27、FR30、FR42、FR49 的方向仍然成立。
- Epics：不需要缩小 Story 5.4；应按原 Epic 5.4 补实现。
- Architecture：需要落实 flow 文档中要求的库存分配表，而不是只在明细上写锁定数量。
- UX：需要补齐 UX-DR26 的操作按钮直达和履行类型选择体验。
- Story 实现记录：需要将当前 Story 5.4 从“只读字段补齐”改为“第一部分已完成，继续补齐确认分配闭环”，完成后再标记 done。

## 3. Recommended Approach

选择路径：Direct Adjustment。

理由：

- 当前实现没有破坏数据模型，字段补齐和详情展示可直接保留。
- 库存基础模块已存在，补齐确认分配主要是把发货需求领域动作接入现有 InventoryService。
- 回滚当前提交不会降低复杂度，反而会丢失已完成的详情字段价值。
- 不需要重新定义 MVP，仅需完成 Epic 5.4 的原验收标准。

范围分类：Minor to Moderate。由 Developer agent 直接继续实现，之后运行单测、构建和 code review。

## 4. Detailed Change Proposals

### Story 5.4 Acceptance Criteria

OLD:

- 本 Story 不新增库存写操作、临时库存表、mock 库存 API、重复枚举、通用状态 PATCH；库存锁定和状态推进留待具备分配表/库存流水后的领域动作实现。

NEW:

- 本 Story 保留已完成的详情字段补齐，同时补齐 Epic 5.4 的确认分配闭环：履行类型编辑、确认分配动作端点、FIFO 库存锁定、发货需求库存分配记录、明细数量回填、状态推进和操作记录。
- 状态推进必须通过专用动作端点执行，不允许前端提交目标状态。
- 库存锁定必须消费现有 `InventoryService` 的事务/行锁能力，并写入 `shipping_demand_inventory_allocations`，供后续出库和作废解锁消费。

Rationale:

Epic 5.4 原始验收标准明确要求“含完整库存锁定”。当前底座已有库存双层结构与 FIFO 锁定服务，继续保留只读边界会阻塞 Story 5.5、Epic 6 和 Epic 7。

### Backend Proposal

- 新增 `shipping_demand_inventory_allocations` 实体和迁移，字段包含：`shipping_demand_id`、`shipping_demand_item_id`、`sku_id`、`warehouse_id`、`inventory_batch_id`、`locked_quantity`、`shipped_quantity`、`status`、`source_action_key`。
- 新增确认分配 DTO，行级字段包含 `itemId`、`fulfillmentType`、`stockQuantity`、`warehouseId`。
- 新增动作端点：`POST /shipping-demands/:id/confirm-allocation`。
- 后端校验发货需求必须处于 `pending_allocation`；所有行必须提交履行类型；数量满足 `required = stock + purchase`。
- 对 `stockQuantity > 0` 的行调用 `InventoryService.lockStockInTransaction()` 按 FIFO 锁定，并保存返回的批次 allocation。
- 更新发货需求明细和发货需求状态：有采购数量则 `purchasing`，否则 `prepared`。
- 写入操作日志，记录状态、履行类型和库存锁定摘要。

### Frontend Proposal

- 产品明细表在 `pending_allocation` 状态显示履行类型 Select。
- 根据履行类型自动计算默认库存使用数量：库存充足时默认使用库存，否则不足部分采购。
- 提供仓库选择/使用数量输入，提交前校验必填和数量边界。
- 增加 Primary“确认分配”按钮，Popconfirm 确认后调用动作端点。
- 成功后 Notification.success，刷新发货需求详情和操作记录。
- 非 `pending_allocation` 状态保持只读展示。

## 5. Implementation Handoff

执行角色：Developer agent。

成功标准：

- Story 5.4 不再只是只读详情；可在详情页完成履行类型决策和确认分配。
- 后端通过事务完成 FIFO 锁定，写入分配表并更新明细缓存数量。
- 发货需求状态按分配结果自动推进。
- 前端成功提交后刷新 KPI、库存状态和操作记录。
- 定向单测、API build、Web build 通过。

## 6. Approval

用户已明确批准方向：当前实现视为 5.4 第一部分，继续补齐 Epic 5.4 缺口，包括操作按钮、履行类型编辑、确认分配接口、FIFO 锁定、库存流水、前端校验和成功刷新，完成后再把 story 标成 done。

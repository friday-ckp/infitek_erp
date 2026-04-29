---
title: 'Story 5.4 发货需求确认分配纠偏'
type: 'feature'
created: '2026-04-28'
status: 'done'
baseline_commit: '3cfae3d3c3df6c70e85da95b8dbe83a6db608a7e'
context:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/flow-quantity-data-lineage.md'
  - '_bmad-output/planning-artifacts/flow-state-machine.md'
  - '_bmad-output/planning-artifacts/flow-cross-document-trigger.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 当前 Story 5.4 实现只完成发货需求详情字段补齐和只读枢纽展示，未满足 Epic 5.4 的操作按钮、履行类型编辑、确认分配、FIFO 库存锁定和成功刷新要求。

**Approach:** 保留当前字段补齐成果作为 5.4 第一部分，继续补齐确认分配闭环：前端可编辑履行类型并提交，后端通过专用动作端点在事务中持久化分配、调用现有 InventoryService FIFO 锁定库存、更新发货需求明细和状态，并记录操作轨迹。

## Boundaries & Constraints

**Always:** 遵守 Epic 5-7 三份 flow 文档；状态推进必须由后端领域动作完成；库存写操作必须使用 QueryRunner 事务和现有 InventoryService 行锁能力；锁定结果必须写入发货需求库存分配表，不能只改明细缓存数量；前端 API 调用必须走 `apps/web/src/api`。

**Ask First:** 如果发现必须重构 InventoryService 公共事务模型、大幅改动库存基础表、或需要提前实现完整采购/物流/出库模块，先暂停确认。

**Never:** 不新增 mock 库存 API；不通过通用 PATCH 直接改状态；不重复定义共享枚举；不回滚已完成的详情字段补齐；不实现 Story 5.5 的作废和完整物流创建。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 全部使用库存 | 发货需求 `pending_allocation`，所有行选择 `use_stock` 且库存足够 | 写入 allocation，明细 `locked_remaining_quantity = required_quantity`，需求状态进入 `prepared`，详情刷新 KPI | N/A |
| 部分采购 | 至少一行选择 `partial_purchase` 或 `full_purchase` | 库存部分锁定，采购部分写入 `purchase_required_quantity`，需求状态进入 `purchasing` | N/A |
| 未选履行类型 | 任一行缺少履行类型 | 阻止提交，提示需完整设置 | 前端内联/消息提示，后端 400 |
| 库存不足 | 提交的库存使用量超过可用库存 | 不产生重复锁定，返回 SKU/可用量相关错误 | 后端 400 `STOCK_INSUFFICIENT`，前端显示错误 |
| 重复确认 | 需求已离开 `pending_allocation` 后再次提交 | 不再次锁定库存 | 后端返回业务错误 |

</frozen-after-approval>

## Code Map

- `apps/api/src/modules/shipping-demands/shipping-demands.controller.ts` -- 发货需求动作端点入口。
- `apps/api/src/modules/shipping-demands/shipping-demands.service.ts` -- 生成、详情、确认分配事务逻辑。
- `apps/api/src/modules/shipping-demands/entities/shipping-demand-item.entity.ts` -- 履行数量缓存字段已存在。
- `apps/api/src/modules/inventory/inventory.service.ts` -- 已有 FIFO 锁定、解锁、扣减和并发重试能力。
- `apps/api/src/modules/inventory/entities/inventory-batch.entity.ts` -- 批次锁定数量权威字段。
- `apps/web/src/pages/shipping-demands/detail.tsx` -- 发货需求详情枢纽 UI。
- `apps/web/src/api/shipping-demands.api.ts` -- 前端发货需求 API 类型和动作调用。

## Tasks & Acceptance

**Execution:**
- [x] `apps/api/src/modules/shipping-demands/entities/shipping-demand-inventory-allocation.entity.ts` -- 新增发货需求库存分配实体，保存需求明细到仓库/批次的锁定结果。
- [x] `apps/api/src/migrations/*shipping-demand-inventory-allocations*.ts` -- 新增分配表迁移。
- [x] `apps/api/src/modules/shipping-demands/dto/confirm-shipping-demand-allocation.dto.ts` -- 新增确认分配输入 DTO。
- [x] `apps/api/src/modules/shipping-demands/shipping-demands.service.ts` -- 新增确认分配事务、校验、FIFO 锁定、状态推进和操作日志。
- [x] `apps/api/src/modules/shipping-demands/shipping-demands.controller.ts` -- 新增 `POST /shipping-demands/:id/confirm-allocation` 动作端点。
- [x] `apps/api/src/modules/shipping-demands/tests/shipping-demands.service.spec.ts` -- 覆盖全部库存、部分采购、状态防重复和库存不足。
- [x] `apps/web/src/api/shipping-demands.api.ts` -- 新增确认分配 payload 类型和 API 函数。
- [x] `apps/web/src/pages/shipping-demands/detail.tsx` -- 新增履行类型编辑、所选仓库库存使用数量校验、FIFO 批次预览、确认分配按钮和成功刷新。
- [x] `_bmad-output/implementation-artifacts/5-4-发货需求枢纽详情页.md` -- 更新 Story 记录，移除“只读完成”的错误终态，记录纠偏完成。

**Acceptance Criteria:**
- Given 发货需求处于 `pending_allocation`，when 用户完成履行类型选择并确认分配，then 后端持久化履行类型、库存/采购数量、批次 allocation，并按结果推进状态。
- Given 有库存使用数量，when 确认分配，then 系统按 FIFO 锁定库存并刷新详情 KPI。
- Given 需求已确认分配，when 再次提交，then 不重复锁定库存并返回业务错误。

## Design Notes

本次只实现 Story 5.4 的确认分配闭环。采购订单创建、物流单创建、作废释放库存、出库消费 allocation 属于后续 Story，但 allocation 表必须现在建立，避免后续只能从明细缓存反推批次。

## Verification

**Commands:**
- `pnpm --filter api exec jest modules/shipping-demands/tests --runInBand` -- passed: 2 个测试套件、14 个用例通过。
- `pnpm --filter api build` -- passed: TypeScript 编译通过。
- `pnpm --filter web build` -- passed: 前端构建通过；保留既有 Vite chunk size warning。

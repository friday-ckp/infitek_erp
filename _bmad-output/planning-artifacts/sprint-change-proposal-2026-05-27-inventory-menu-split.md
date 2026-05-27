# Sprint Change Proposal: 库存管理菜单拆分与页面边界整理

Date: 2026-05-27
Project: infitek_erp
Owner: friday
Mode: Batch
Skill: bmad-correct-course

## 1. Issue Summary

库存基础能力在 Story 5.0 为了支撑 Story 5.2 前置落地时，将期初库存录入、可用库存查询和批次库存明细集中放进 `apps/web/src/pages/inventory/index.tsx` 的同一个页面。Story 6.2 又在同一库存页面增加“查看变动流水”抽屉，同时补了独立的 `库存变动流水` 菜单。随着库存链路继续完成，这个入口已经从“临时便捷聚合页”变成了较重的混合工作台。

当前问题不是库存模型或接口能力失败，而是信息架构和页面职责边界不清：

- 期初库存录入是系统上线/初始化动作，属于低频写操作，需要独立菜单和明确二次确认语义。
- 可用库存查询是日常查询入口，应聚焦 `SKU + 仓库` 的实际库存、锁定量、可用库存。
- 批次库存明细是 FIFO、来源单据和批次追溯入口，应独立展示批次粒度，不应被塞在可用库存查询页底部。
- 库存变动流水已经有独立菜单，但库存查询页仍内嵌流水抽屉，容易继续强化“所有库存东西都在一个页”的使用心智。

支持证据：

- Story 5.0 的 AC9 只要求“前端新增库存基础入口，可完成期初库存录入并查看 SKU+仓库库存查询结果”，当时为了效率合并实现。
- Story 6.2 的 Dev Notes 明确记录当前库存页面“已有期初库存录入、可用库存汇总表、批次库存明细”，并在此基础上增加流水抽屉。
- 当前代码 `apps/web/src/pages/inventory/index.tsx` 已约 846 行，包含期初录入表单、可用库存查询、批次库存表、库存流水 Drawer 多个职责。
- 当前侧边栏 `库存管理` 下已有 `/inventory` 和 `/inventory/transactions`，但缺少独立的 `期初库存录入`、`可用库存查询`、`批次库存明细` 菜单项。

## 2. Checklist Findings

| Checklist Item | Status | Finding |
|---|---|---|
| 1.1 Triggering story | Done | 触发源是 Story 5.0 的库存基础聚合页实现；Story 6.2 又在该页叠加库存流水抽屉，使页面职责进一步膨胀。 |
| 1.2 Core problem | Done | 问题类型为“已实现方案的信息架构边界不清”，不是库存模型、后端 API 或交易链路失败。 |
| 1.3 Evidence | Done | `inventory/index.tsx` 集中多个库存工作流；PRD FR40/FR43 对期初录入、库存查询、历史流水本身是不同操作语义；用户反馈该菜单混乱。 |
| 2.1 Current epic impact | Done | Epic 5、6 已 done，不需要回滚；以补丁 Story 方式整理页面与菜单即可。 |
| 2.2 Epic-level changes | Action-needed | 建议在 Epic 5 或 Epic 8 增加补丁故事：库存管理菜单拆分与页面边界整理。 |
| 2.3 Remaining epics impact | Done | 主交易链 Epic 6-8 已完成；本变更不改变采购、收货、物流、出库流程。 |
| 2.4 New epic need | N/A | 不需要新增 Epic。 |
| 2.5 Priority/order | Done | 应在继续增加库存相关功能前优先处理，避免后续功能继续叠加到混合页。 |
| 3.1 PRD conflict | Action-needed | PRD FR40/FR43 无需改需求目标，但“库存台账/期初库存”表达应补充为独立菜单边界。 |
| 3.2 Architecture conflict | Done | 不改变库存双层结构、事务、行锁、API 前缀或 shared 枚举；只调整前端路由/页面组织，必要时复用现有 API。 |
| 3.3 UI/UX conflict | Action-needed | 需要更新库存管理导航、面包屑、页面标题、快捷跳转和页面职责。 |
| 3.4 Other artifacts | Action-needed | 需更新 `epics.md`、新增补丁 Story、`sprint-status.yaml`；可选更新 `project-context.md` 的库存页面规则。 |
| 4.1 Direct adjustment | Viable | 新增补丁 Story 拆分路由和页面，复用现有 API。Effort: Medium。Risk: Low-Medium。 |
| 4.2 Rollback | Not viable | 回滚 Story 5.0/6.2 会破坏已完成库存基础与流水能力，收益低。 |
| 4.3 MVP review | Not viable | MVP 仍成立，无需缩减范围。 |
| 4.4 Recommended path | Done | 选择 Direct Adjustment。 |
| 5.1-5.5 Proposal components | Done | 本文包含问题摘要、影响、详细变更、实现 handoff 和成功标准。 |
| 6.1-6.2 Final review | Done | Proposal 已按 Batch 汇总。 |
| 6.3 Approval | Action-needed | 需用户批准后再更新 sprint-status 和创建补丁 Story。 |
| 6.4 sprint-status update | N/A before approval | 批准前不修改 sprint-status；批准后新增补丁 Story 条目。 |

## 3. Impact Analysis

### Epic Impact

| Epic | Impact | Required Change |
|---|---|---|
| Epic 5 销售订单与发货需求管理 | Story 5.0 已完成库存基础能力，但前端入口边界过粗。 | 增加 Story 5.7 作为补丁，拆分库存基础页面和菜单；不改变 5.2/5.4 的库存消费方式。 |
| Epic 6 采购订单与收货入库 | Story 6.2 已完成库存流水并补独立菜单。 | 保留 `库存变动流水` 独立菜单；从库存查询页移除或弱化内嵌流水抽屉，改为跳转独立流水页并带筛选参数。 |
| Epic 7 物流单与发货出库 | 无业务影响。 | 不改变出库库存扣减、allocation 消费和流水写入。 |
| Epic 8 发货需求枢纽库存决策 | 无状态机影响，但库存查询入口可作为运营辅助。 | 无需改状态机；可在 UI 上提供从可用库存行跳转批次/流水的上下文链接。 |

### Artifact Conflicts

| Artifact | Conflict | Change Needed |
|---|---|---|
| PRD FR40 | 期初库存录入被实现为库存查询页内的一段表单。 | 补充“期初库存录入为独立菜单/页面，面向初始化和纠正上线初始账面库存”。 |
| PRD FR43 | “按 SKU 或仓库查询当前库存数量及历史变动流水”目前部分混在单页。 | 明确当前库存、批次明细、历史流水为库存管理下三个查询入口。 |
| `epics.md` Story 5.0 | AC9 只说“库存基础入口”，容易继续允许单页聚合。 | 新增补丁 Story，约束页面拆分和路由兼容。 |
| UX Spec / Sidebar | 库存管理菜单缺少细分项。 | 更新库存管理子菜单：期初库存录入、可用库存查询、批次库存明细、库存变动流水、收货入库、发货出库。 |
| Implementation artifacts | Story 5.0/6.2 记录当前实现状态。 | 新增补丁 Story，不改写历史完成事实；在 Dev Notes 中引用 5.0/6.2。 |

### Technical Impact

- 前端路由建议新增：
  - `/inventory/opening-balances`：期初库存录入
  - `/inventory/available`：可用库存查询
  - `/inventory/batches`：批次库存明细
  - `/inventory/transactions`：库存变动流水（已存在）
- `/inventory` 保持兼容，建议重定向到 `/inventory/available`，避免旧链接失效。
- 侧边栏 `库存管理` 子菜单建议调整为：
  - 期初库存录入
  - 可用库存查询
  - 批次库存明细
  - 库存变动流水
  - 收货入库
  - 发货出库
- `apps/web/src/pages/inventory/index.tsx` 应拆分为多个页面和共享组件：
  - `opening-balances.tsx`
  - `available.tsx`
  - `batches.tsx`
  - `transactions.tsx` 保留或轻微对齐筛选参数
  - `components/` 提取库存指标、SKU/仓库筛选、变动类型 Tag、来源单据链接等复用组件
- 现有 API 可优先复用：
  - `POST /api/inventory/opening-balances`
  - `GET /api/inventory/available`
  - `GET /api/inventory/batches`
  - `GET /api/inventory/transactions`
- 如发现批次明细接口缺少独立页面所需筛选或分页，可在同一补丁 Story 内小幅扩展查询 DTO；不得改变库存写入逻辑、库存数量口径或交易状态机。

## 4. Recommended Approach

推荐路径：Direct Adjustment。

范围分类：Moderate。

理由：

- 当前功能能力已经可用，不需要回滚库存基础、流水、收货或出库链路。
- 用户反馈指向菜单和页面边界混乱，最小正确修复是拆路由、拆页面、拆菜单，而不是改库存领域模型。
- 拆分后能减少后续库存功能继续堆到 `inventory/index.tsx` 的风险，也便于不同岗位按任务进入页面。
- 本变更不影响 MVP 的核心端到端链路，只提升操作清晰度和维护性。

建议新增补丁 Story：

**Story 5.7: 库存管理菜单拆分与页面边界整理**

As a 仓库人员和系统管理员,
I want 将期初库存录入、可用库存查询、批次库存明细和库存变动流水拆分为独立菜单,
so that 我可以按实际任务快速进入对应页面，避免在一个混合页面中查找操作入口。

建议验收标准：

1. `库存管理` 侧边栏下展示独立子菜单：`期初库存录入`、`可用库存查询`、`批次库存明细`、`库存变动流水`、`收货入库`、`发货出库`。
2. `/inventory` 旧路径不失效，自动重定向或等价进入 `可用库存查询`。
3. `期初库存录入` 页面只承担 SKU、仓库、期初数量、入库日期录入和保存后的反馈；不得混入可用库存大表或批次明细大表。
4. `可用库存查询` 页面展示 SKU+仓库维度的实际库存、锁定量、可用库存，支持 SKU/仓库筛选、空状态、加载态和错误态。
5. `批次库存明细` 页面展示批次号、SKU、仓库、批次数量、锁定量、批次可用、来源类型/来源单据、入库日期，支持 SKU/仓库筛选；如 API 已支持则复用现有接口。
6. `库存变动流水` 页面继续作为独立页面存在，支持从可用库存或批次明细页面带筛选条件跳转；不再要求库存查询页内嵌完整流水 Drawer。
7. 面包屑、页面标题和浏览器路由与新菜单一致；刷新页面不丢失当前路由。
8. 不改变 `inventory_summary`、`inventory_batch`、`inventory_transactions` 数据模型，不改变库存写入、锁定、解锁、入库、出库、流水幂等逻辑。
9. 前端 API 调用继续通过 `apps/web/src/api/inventory.api.ts` 和 TanStack Query；组件内不得直接 axios。
10. 至少运行 `pnpm --filter web build`；若扩展后端批次查询接口，补充相关 API 定向测试并运行 `pnpm --filter api build`。

## 5. Detailed Change Proposals

### Proposal A — Sidebar Menu

Target: `apps/web/src/components/layout/Sidebar.tsx`

OLD:

```ts
children: [
  { key: '/inventory', label: '库存查询', exact: true },
  { key: '/receipt-orders', label: '收货入库' },
  { key: '/outbound-orders', label: '发货出库' },
  { key: '/inventory/transactions', label: '库存变动流水' },
]
```

NEW:

```ts
children: [
  { key: '/inventory/opening-balances', label: '期初库存录入' },
  { key: '/inventory/available', label: '可用库存查询' },
  { key: '/inventory/batches', label: '批次库存明细' },
  { key: '/inventory/transactions', label: '库存变动流水' },
  { key: '/receipt-orders', label: '收货入库' },
  { key: '/outbound-orders', label: '发货出库' },
]
```

Rationale: 菜单按用户任务拆分，避免“库存查询”承载写入、查询、追溯三类不同工作。

### Proposal B — Routes

Target: `apps/web/src/App.tsx`

OLD:

```tsx
<Route path="/inventory/transactions" element={<InventoryTransactionsPage />} />
<Route path="/inventory" element={<InventoryPage />} />
<Route path="/inventory/*" element={<InventoryPage />} />
```

NEW:

```tsx
<Route path="/inventory" element={<Navigate to="/inventory/available" replace />} />
<Route path="/inventory/opening-balances" element={<InventoryOpeningBalancesPage />} />
<Route path="/inventory/available" element={<InventoryAvailablePage />} />
<Route path="/inventory/batches" element={<InventoryBatchesPage />} />
<Route path="/inventory/transactions" element={<InventoryTransactionsPage />} />
```

Rationale: 保留旧入口兼容，同时让每个库存工作流拥有明确路由。

### Proposal C — Breadcrumbs

Target: `apps/web/src/components/layout/AppLayout.tsx`

OLD:

```ts
...createCrudBreadcrumbRoutes({
  basePath: "/inventory",
  sectionLabel: "库存管理",
  sectionPath: INVENTORY_SECTION_PATH,
  listLabel: "库存查询",
}),
```

NEW:

```ts
...createCrudBreadcrumbRoutes({
  basePath: "/inventory/opening-balances",
  sectionLabel: "库存管理",
  sectionPath: "/inventory/available",
  listLabel: "期初库存录入",
}),
...createCrudBreadcrumbRoutes({
  basePath: "/inventory/available",
  sectionLabel: "库存管理",
  sectionPath: "/inventory/available",
  listLabel: "可用库存查询",
}),
...createCrudBreadcrumbRoutes({
  basePath: "/inventory/batches",
  sectionLabel: "库存管理",
  sectionPath: "/inventory/available",
  listLabel: "批次库存明细",
}),
```

Rationale: 面包屑和菜单保持同一任务口径。

### Proposal D — Page Split

Target: `apps/web/src/pages/inventory/`

OLD:

```text
index.tsx
transactions.tsx
inventory.css
```

NEW:

```text
opening-balances.tsx
available.tsx
batches.tsx
transactions.tsx
components/
  InventoryMetric.tsx
  InventoryFilters.tsx
  InventoryChangeTypeTag.tsx
  SourceDocumentLink.tsx
inventory.css
```

Rationale: 将 846 行混合页拆成任务页面和复用组件，降低后续改动风险。

### Proposal E — PRD/Epic Text

Target: `_bmad-output/planning-artifacts/epics.md`

Add after Story 5.0 or as补丁 story:

```md
### Story 5.7: 库存管理菜单拆分与页面边界整理

As a 仓库人员和系统管理员,
I want 将期初库存录入、可用库存查询、批次库存明细和库存变动流水拆分为独立菜单,
so that 我可以按实际任务快速进入对应页面，避免在一个混合页面中查找操作入口。
```

Rationale: 以新补丁 Story 承载菜单拆分，不改写 Story 5.0/6.2 已完成事实。

## 6. Implementation Handoff

Scope: Moderate。

Recommended handoff:

- Product/Owner：批准本 proposal，并确认新菜单命名。
- Developer agent：创建 Story 5.7，执行页面拆分、路由/菜单/面包屑更新和构建验证。
- Reviewer：重点检查是否只做 UI/路由边界整理，未破坏库存写入、流水、收货、出库主链。

Implementation sequence:

1. 用户批准本 Sprint Change Proposal。
2. 更新 `sprint-status.yaml`，新增 `5-7-库存管理菜单拆分与页面边界整理: backlog`。
3. 运行 `bmad-create-story` 创建 Story 5.7。
4. 使用 `start story 5-7` 进入实现。
5. 完成后运行 code review，重点审路由兼容、菜单高亮、面包屑、页面职责和 build。

Success criteria:

- 用户进入库存管理时能清楚选择期初录入、可用库存查询、批次库存明细、库存变动流水。
- 原 `/inventory` 入口不会 404。
- 可用库存查询页不再承担期初录入和批次明细完整展示。
- 期初库存录入页不再被日常查询表格淹没。
- 批次库存明细可以独立筛选和查看 FIFO 来源。
- 库存变动流水继续独立可查，并支持从其他库存页面带上下文跳转。
- 库存数量模型和交易链路无回归。

## 7. Approval

Status: Approved by user on 2026-05-27.

已批准继续执行 sprint-status 更新和补丁 Story 创建；本 proposal 不直接修改业务代码。

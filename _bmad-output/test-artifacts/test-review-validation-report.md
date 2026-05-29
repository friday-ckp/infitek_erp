# Test Review Validation Report

Date: 2026-05-28
Reviewer: Codex / BMad TEA
Language: Chinese
Scope: 单文件审查 + 证据审查
Reviewed Files:
- `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts`
- `apps/web/playwright.config.ts`
- `_bmad-output/test-artifacts/test-design-epic-6-8.md`
- `_bmad-output/implementation-artifacts/tests/test-summary.md`

Execution Evidence:
- Re-ran `pnpm --filter web exec playwright test e2e/epic-6-8-fulfillment-chain.spec.ts --project=chromium`
- Result: 2 passed (6.1s)

Quality Score: 62/100
Grade: C
Recommendation: BLOCK 作为 Epic 6-8 质量门槛；可接受为“补上的初版真实环境 smoke 证据”

## Executive Summary

本次新增 Playwright spec 本身并不差：没有硬等待，没有显式分支控制流，断言里已经开始校验跨单据数量与状态，且 Chromium 复跑通过。

但它目前还**不能作为 Epic 6-8 的质量门槛**。核心原因不是“没跑通”，而是“证据类型不够强”：

1. 它读取现成环境数据并做详情页核对，不是真正驱动 `销售 -> 发货需求 -> 采购 -> 收货 -> 锁定 -> 物流 -> 出库` 的闭环动作测试。
2. 它依赖共享环境里“刚好存在一条满足条件的数据”，不具备稳定的 fixture/seeding/cleanup，因此不满足门槛级证据对可重复、可隔离、可并行的要求。
3. Epic 6-8 测试设计文档中列出的多个 P0/高风险门槛仍然处于“Planned”，当前 2 条通过证据不足以关闭 R-001 ~ R-005。

## Findings

### Must Fix

1. **不是闭环测试，只是对既有业务事实做观测性抽查**
   - Evidence:
     - `loadShippedChain()` 通过列表接口挑选已存在的 `confirmed` 出库单，再逐级 GET 详情；并没有创建、确认、收货、出库等动作调用。
     - `loadReceivedPurchaseChain()` 同样只读取现有 `confirmed` 收货单和关联采购单/发货需求。
   - References:
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:170-198`
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:201-227`
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:238-357`
   - Impact:
     - 这类测试无法证明“创建动作、确认动作、自动锁定、状态推进、幂等控制”在当前代码下仍然正确。
     - 如果动作端点回归，但数据库里已有老数据仍然满足状态，测试依然可能通过。
   - Gate Decision:
     - 对“真实环境 smoke”可接受。
     - 对“真实闭环质量门槛”不可接受。

2. **依赖共享环境现有数据，缺少 seeding / cleanup，门槛证据不具备可重复性**
   - Evidence:
     - 测试通过 `list.find(...)` 挑第一条匹配记录，要求环境中“至少存在一条已确认发货出库单 fixture / 已确认收货入库单 fixture”。
     - 没有本测试专属数据创建、隔离标识、清理逻辑。
   - References:
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:174-177`
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:205-208`
     - `_bmad-output/test-artifacts/test-design-epic-6-8.md:243-246`
   - Impact:
     - 测试结果受环境数据漂移影响，无法保证每次覆盖到同一业务形态。
     - 并行执行、环境复用、数据修复、人工操作都可能让测试变成“偶然绿”。
   - Gate Decision:
     - 不满足 `test-quality.md` 与 `data-factories.md` 对 deterministic / isolated / cleanup-safe 的要求。

3. **当前通过证据远不足以满足 Epic 6-8 既定门槛**
   - Evidence:
     - 测试总结里只有 2 条 Chromium 通过证据。
     - 测试设计要求的 P0 还包括：全库存路径、全采购路径、部分采购、部分收货、部分出库、幂等重复提交、库存流水完整性等。
     - 文档明确把 R-001 ~ R-005 设为发布前必须缓解/豁免的高风险。
   - References:
     - `_bmad-output/implementation-artifacts/tests/test-summary.md:14-21`
     - `_bmad-output/test-artifacts/test-design-epic-6-8.md:157-167`
     - `_bmad-output/test-artifacts/test-design-epic-6-8.md:266-284`
     - `_bmad-output/test-artifacts/test-design-epic-6-8.md:290-320`
   - Impact:
     - 目前只能说明“已发货详情链路”和“已收货详情链路”各有一条环境样本被验证过。
     - 还不能说明核心状态机、数量事实、幂等、部分路径、库存流水、性能约束已被门槛化验证。
   - Gate Decision:
     - 当前证据集不足以做 release-quality gate。

### Should Fix

4. **部分 UI 断言过于泛化，存在误命中风险**
   - Evidence:
     - `firstText(page, '已确认')`、`firstText(page, '采购中')`、`firstText(page, '已发运')` 等断言可能命中摘要区、操作记录、时间线、Tag 之外的任意位置。
     - `firstText()` 统一取 `.first()`，会放大“页面上任何一个同文案元素即可通过”的问题。
   - References:
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:233-235`
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:274-289`
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:336-356`
   - Impact:
     - 页面主状态组件退化时，测试仍可能因为时间线或别处的同文案而通过。

5. **单文件过大且混合 API 审计 + UI 详情断言，后续扩展到完整门槛时可维护性会快速下降**
   - Evidence:
     - 当前 spec 已 358 行，超过知识库建议的单测试文件理想上限 300 行。
     - 同文件承载认证、API 装载、数量汇总、两个业务链路、多个页面详情断言。
   - References:
     - `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts:1-358`
   - Impact:
     - 如果继续把幂等、部分发货、库存流水、性能断言都塞进去，调试成本会明显上升。

## What Passed Well

- PASS: Playwright 框架识别正确，配置文件存在，`baseURL` / `webServer` 设置合理。
- PASS: 无硬等待、无 try/catch 控制流、无随机数据、无条件分支驱动流程。
- PASS: 有显式数量断言，不只是“看见下游单据就算完成”。
- PASS: 有基本跨文档 UI 跳转验证，能补上此前前端主链自动化完全空白的问题。
- PASS: Chromium 实测可运行，执行时间 6.1s，作为 smoke 很有价值。

## Checklist Assessment

### Prerequisites

- PASS: Test file identified and readable.
- PASS: Playwright framework and config detected.
- PASS: Story-equivalent context and test design document discovered.
- PASS: Priority context extracted (`P0` in spec/test summary, P0-P3 in design).
- PASS: Knowledge base fragments loaded: `tea-index.csv`, `test-quality.md`, `fixture-architecture.md`, `network-first.md`, `data-factories.md`, `test-levels-framework.md`.

### Context Loading

- PASS: Review scope determined as single-suite review.
- PASS: Related artifacts discovered.
- PASS: Quality criteria and gate documents loaded.

### Test File Parsing

- PASS: File parsed successfully.
- PASS: `describe` block count = 1.
- PASS: `test` block count = 2.
- WARN: No canonical test IDs like `6.8-E2E-001`.
- PASS: Priority markers exist in title (`P0`).
- PASS: Imports/dependencies simple and understandable.
- PASS: No hard waits detected.
- PASS: No conditionals / try-catch flow control detected.
- WARN: No fixture composition / factory setup / cleanup pattern detected.
- WARN: Assertions include broad text matches that may false-pass.

### Quality Criteria Validation

| Criterion | Status | Notes |
| --- | --- | --- |
| BDD / readability | WARN | 业务 intent 清晰，但未使用更明确的 Given-When-Then 结构。 |
| Test IDs | WARN | 缺少规范化 test ID。 |
| Priority markers | PASS | 标题带 `P0`。 |
| Hard waits | PASS | 未发现 `waitForTimeout`。 |
| Determinism | FAIL | 依赖共享环境现有数据。 |
| Isolation | FAIL | 无 seeding / cleanup / 数据隔离。 |
| Fixture patterns | WARN | 有 helper，但不是可复用 fixture 组合。 |
| Data factories | FAIL | 无工厂建数，未通过 API seed 自有数据。 |
| Network-first | N/A | 这是直连真实后端的 API + 页面详情检查，不是前端拦截型测试。 |
| Assertions | WARN | 既有强断言，也有易误命中的弱 UI 断言。 |
| Test length | WARN | 文件 358 行，超过理想阈值。 |
| Test duration | PASS | 当前实测 6.1s。 |
| Flakiness patterns | WARN | 环境数据漂移与泛文本断言是主要风险。 |

### Quality Score Rationale

- Start at 100
- -10: 非闭环动作验证，无法作为闭环门槛
- -10: 非确定性环境取数
- -10: 非隔离、无 cleanup
- -5: 质量门槛覆盖缺口大（P0 / 风险门槛未关闭）
- -2: UI 断言过泛
- -1: 缺少规范测试 ID
- Final: 62

## Quality Gate Decision

### Decision

BLOCK

### Why

当前证据更像“真实环境样本审计 smoke”，而不是“可复现、可追责、可阻断发布”的闭环质量门槛。

### Minimum Upgrade Needed Before It Can Be a Gate

1. 用 API seed / requestKey 驱动至少 1 条真正的全链 happy path，从创建销售订单开始，直到最终 `shipping demand` / `sales order` 变为 `shipped`。
2. 增加 P0 的部分路径与幂等路径，至少覆盖：
   - 部分收货仍保持 `purchasing`
   - 部分出库进入 `partially_shipped`
   - 重复提交不重复写数量事实
   - `inventory_transactions` / `sourceActionKey` 证据
3. 将共享环境取样测试降级标注为 `smoke` 或 `observational`，不要充当 release gate 主证据。
4. 强化 UI 断言，绑定摘要区/状态 Tag/关键组件，而不是泛文本 `.first()`。

## Best Practices Worth Keeping

- 通过 API 先拿到业务主键，再做 UI 核对，这个方向是对的。
- 数量断言已经开始跨单据求和校验，比只断言“状态文本存在”更接近真正业务事实。
- 把“真实环境 smoke”和“门槛级可重复测试”分层，是下一步最自然的演进路径。

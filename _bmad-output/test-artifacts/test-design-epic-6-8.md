---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted:
  - 'step-01-detect-mode'
  - 'step-02-load-context'
  - 'step-03-risk-and-testability'
  - 'step-04-coverage-plan'
  - 'step-05-generate-output'
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-28'
mode: 'epic-level'
epic: 'Epic 6-8 主履约交易链'
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/epic-6-8-retro-2026-05-27.md
  - _bmad-output/planning-artifacts/flow-cross-document-trigger.md
  - _bmad-output/planning-artifacts/flow-state-machine.md
  - _bmad-output/planning-artifacts/flow-quantity-data-lineage.md
  - _bmad-output/implementation-artifacts/6-2-库存变动流水.md
  - _bmad-output/implementation-artifacts/6-3-采购订单创建与确认.md
  - _bmad-output/implementation-artifacts/6-5-收货入库单创建与确认.md
  - _bmad-output/implementation-artifacts/6-6-收货后自动触发.md
  - _bmad-output/implementation-artifacts/7-1-物流单创建.md
  - _bmad-output/implementation-artifacts/7-3-发货出库单创建与确认.md
  - _bmad-output/implementation-artifacts/7-4-发货出库后状态联动.md
  - _bmad-output/implementation-artifacts/8-1-发货需求状态自动流转.md
---

# Test Design: Epic 6-8 - 主履约交易链

**Date:** 2026-05-28
**Author:** Friday / BMad TEA
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for the completed MVP fulfillment chain:

销售订单 -> 发货需求确认分配 -> 生成采购单 -> 收货入库 -> 请购型自动锁定 -> 创建物流单 -> 发货出库 -> 发货需求/销售订单最终状态展示。

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (>=6): 5
- Critical categories: DATA, TECH, BUS, PERF

**Coverage Summary:**

- P0 scenarios: 9 (~20-35 hours)
- P1 scenarios: 14 (~18-30 hours)
- P2/P3 scenarios: 10 (~8-18 hours)
- **Total effort:** ~46-83 hours (~1.5-2.5 weeks)

This plan treats existing module-level Jest tests as useful evidence, but not sufficient release evidence. The current gap is cross-document, end-to-end validation across the whole transaction chain.

---

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| 物流费用、质检、通知单、退货/取消完整闭环 | Retro states these are Post-MVP or future prioritization items. | Track in Post-MVP planning before adding to release gate. |
| Full performance benchmarking for all ERP screens | Current need is release confidence for the transaction chain, not system-wide load certification. | Define targeted 3-second action checks for confirm flows; broader load test can follow in `nfr-assess`. |
| Rewriting existing unit tests | Existing directed API/Jest coverage already exists across shipping, purchase, receipt, logistics, outbound, and inventory modules. | Add only missing cross-chain API/E2E tests and targeted gaps. |
| Browser exploration in this run | No `playwright-cli` was available; no known running web dev server on `localhost:5173`. | Rely on docs/code evidence now; perform Playwright exploration when automation is implemented. |

---

## Risk Assessment

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| R-001 | DATA | 单段测试通过，但跨单据串联后数量事实可能不一致：锁定量、入库量、出库量、销售订单展示缓存出现偏差。 | 2 | 3 | 6 | 建立全链 API/E2E 场景，断言 allocation、inventory_summary、inventory_transactions、shipping_demand_items、sales_order_items 的关键数量。 | QA + Dev | 发布前 |
| R-002 | TECH | 状态机口径分散在 story、flow 文档和代码中，后续变更可能重新引入旧状态口径。 | 2 | 3 | 6 | 用测试固定 `pending_purchase_order -> purchasing -> prepared -> partially_shipped/shipped`，并引用 flow 文档作为断言来源。 | Dev Lead | 发布前 |
| R-003 | DATA | 幂等键或重复提交处理失效会导致重复采购、重复锁定、重复扣库存或重复日志。 | 2 | 3 | 6 | 对采购创建、收货确认、自动锁定、出库确认加入重复请求测试，验证只写一次业务事实。 | Dev | 发布前 |
| R-004 | BUS | 部分采购、部分收货、部分发货路径容易被误判为完成，导致用户看到错误进度和错误可操作按钮。 | 2 | 3 | 6 | 覆盖全库存、全采购、部分采购、部分发货四条主场景；断言 FlowProgress、SmartButton、状态 Tag 和 API 状态一致。 | QA + PM | 发布前 |
| R-005 | PERF | 收货确认与出库确认要求 3 秒内反馈，但跨事务、行锁、流水和状态聚合可能导致超时或无清晰错误。 | 2 | 3 | 6 | 为收货/出库确认 API 增加动作级耗时记录和验收测试；若没有稳定环境阈值，先标 UNKNOWN 并作为 NFR 风险。 | QA + DevOps | 发布前 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| R-006 | OPS | 全量 API Jest 存在历史失败债，可能掩盖交易链新增回归。 | 2 | 2 | 4 | 输出失败分类：交易主链相关必须修复或解释，无关项进入 deferred-work。 | Dev |
| R-007 | TECH | 前端 E2E 当前仅覆盖用户管理，交易主链页面没有自动化覆盖。 | 2 | 2 | 4 | 新增 Playwright 主链 spec，优先使用 API seeding + UI assertion，避免纯 UI 建数过慢。 | QA |
| R-008 | DATA | 操作日志/ActivityTimeline 若缺失或重复，会削弱审计与排障能力。 | 2 | 2 | 4 | 在 P1 覆盖每个关键状态推进的日志事件和中文状态映射。 | Dev |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| --- | --- | --- | ---: | ---: | ---: | --- |
| R-009 | BUS | 列表筛选、关联跳转、空状态文案等次要体验影响验收效率。 | 1 | 2 | 2 | Monitor through manual QA checklist and P2 UI smoke. |

### Risk Category Legend

- **TECH**: Technical/Architecture
- **SEC**: Security
- **PERF**: Performance
- **DATA**: Data integrity
- **BUS**: Business/user workflow impact
- **OPS**: Operations, CI, environment, observability

---

## NFR Planning

**Purpose:** Plan epic-specific NFR validation. This is not a final `nfr-assess` evidence audit.

| NFR Category | Requirement / Threshold | Risk Link | Planned Validation | Evidence Needed |
| --- | --- | --- | --- | --- |
| Security | All transaction APIs remain protected by global JWT auth; front end uses `/api` request layer. Specific role matrix is UNKNOWN. | SEC assumption | API negative checks for unauthenticated access on create/confirm endpoints; review no direct axios usage in new E2E helpers. | API test report, code review notes |
| Performance | 收货确认、出库确认 request should return clear result/error within 3 seconds per Story 6.5/7.3 AC. Environment baseline UNKNOWN. | R-005 | API timing assertions in staging-like environment; collect duration for receipt confirm and outbound confirm. | Playwright/API report with timings |
| Reliability | Confirm actions must be idempotent and safe on retry/concurrent submission. | R-003 | Duplicate request and simulated concurrent request tests for purchase, receipt, lock, outbound. | Jest/API report, source action key evidence |
| Maintainability | Main chain rules must be traceable to flow docs and tests. | R-002 | Test names and docs reference flow state transitions and quantity lineage invariants. | Test design, test code, CI reports |

**Unknown thresholds:**

- Exact staging performance baseline beyond the 3-second action requirement.
- Role/permission matrix for sales, warehouse, purchasing, and logistics users.
- Production-like dataset size for list/detail page performance.

---

## Entry Criteria

- [ ] Epic 6-8 stories remain `done` in `sprint-status.yaml`.
- [ ] Test database or isolated local database can be seeded and cleaned.
- [ ] Admin/test users exist, or auth fixture can create session tokens.
- [ ] Required master data fixtures exist: SKU, warehouse, supplier, contract term, company, ports, logistics provider, customer.
- [ ] The three flow documents are treated as the oracle for expected status/quantity behavior.
- [ ] Known full Jest failures are classified before release decision.

## Exit Criteria

- [ ] All P0 tests pass.
- [ ] P1 pass rate >=95%, with approved waivers for any failure.
- [ ] No open high-priority risk without mitigation or waiver.
- [ ] Transaction chain has at least one automated full-path E2E/API test.
- [ ] NFR evidence is collected or explicitly marked CONCERNS for later `nfr-assess`.

---

## Test Coverage Plan

**Note:** P0/P1/P2/P3 indicate priority and risk, not execution timing.

### P0 (Critical)

**Criteria:** Blocks core transaction journey, high data/business risk, no practical workaround.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | ---: | --- | --- |
| 全库存路径：销售订单生成发货需求，确认分配全部使用现有库存，直接进入 `prepared`。 | API + E2E | R-001, R-002 | 2 | QA | API asserts quantities; UI asserts FlowProgress and SmartButton. |
| 全采购路径：采购单创建、供应商确认、收货入库、自动锁定后进入 `prepared`。 | API | R-001, R-002 | 2 | QA | Covers `pending_purchase_order -> purchasing -> prepared`. |
| 部分采购路径：一部分现货锁定，一部分采购收货后补齐。 | API | R-001, R-004 | 1 | QA | Must assert both allocation sources and final prepared state. |
| 部分收货保持 `purchasing`，不得提前 `prepared`。 | API | R-004 | 1 | Dev | Existing module tests exist; add cross-chain assertion if absent. |
| 创建物流单只能使用已锁定未计划数量，超限返回明确业务错误。 | API | R-001 | 1 | Dev | Validates logistics planned quantity guard. |
| 部分出库推进为 `partially_shipped`，物流单未出完保持 `confirmed`。 | API + UI assertion | R-004 | 1 | QA | Verify demand, sales order, logistics order consistency. |
| 全部出库推进物流单 `shipped`、发货需求 `shipped`、销售订单 `shipped`。 | API + E2E | R-001, R-002 | 1 | QA | Release smoke candidate. |
| 幂等重复提交：采购创建、收货确认、出库确认不会重复写数量事实。 | API | R-003 | 2 | Dev | Can run as targeted Jest/API tests. |
| 库存流水完整性：receipt/lock/outbound 三类流水 delta 和 sourceActionKey 正确。 | API | R-001, R-003 | 1 | Dev | Tie to `inventory_transactions`. |

**Total P0:** 12 scenario checks across 9 grouped tests, ~20-35 hours.

### P1 (High)

**Criteria:** Important workflows, medium risk, common operator paths.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | ---: | --- | --- |
| 发货需求详情返回真实采购单、物流单、出库单计数。 | API | R-004 | 2 | Dev | Existing 8.1 tests are evidence; include in regression. |
| SmartButton 按采购缺口、供应商补全、真实计数启用/禁用。 | Component/E2E | R-004, R-007 | 2 | QA | Prefer UI with mocked/sealed data after API seeding. |
| ActivityTimeline 展示状态变更和中文枚举，不出现英文原值/未知状态。 | API + E2E | R-008 | 2 | QA | Validate after allocation, purchase, receipt, outbound. |
| 采购订单内部确认和供应商确认只走动作端点，通用 PATCH 不改状态。 | API | R-002 | 2 | Dev | Negative test for status patch attempt. |
| 收货表单剩余可收货数量校验，不能超过剩余量。 | API | R-001 | 1 | Dev | Existing 6.5 coverage; include in targeted suite. |
| 出库仓库锁定量不足返回业务码和当前可用/锁定量。 | API | R-001 | 1 | Dev | Error assertion should include actionable quantity. |
| 销售订单、发货需求、物流单三个详情页状态展示一致。 | E2E | R-004, R-007 | 2 | QA | Use direct navigation after seeded full/partial outbound. |
| Full API Jest 失败分类不把历史债归因到本次主链。 | Process | R-006 | 1 | Dev | Output classification artifact. |
| 页面关键入口：采购单、收货、物流、出库从上游单据跳转链路可用。 | E2E | R-007, R-009 | 2 | QA | Smoke only, not full UI data creation. |

**Total P1:** 15 scenario checks across 14 grouped tests, ~18-30 hours.

### P2 (Medium)

**Criteria:** Secondary features, lower risk, edge cases.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | ---: | --- | --- |
| 列表筛选分页：采购订单、物流单、发货需求、库存流水。 | API/E2E smoke | R-009 | 4 | QA | API first; UI only one happy path per page. |
| 物流跟踪字段补填，不推进状态、不写库存。 | API + Component | R-002 | 2 | Dev | Story 7.2 behavior guard. |
| 发货需求作废仅在 `pending_allocation` 可用，释放锁定并回退销售订单。 | API | R-001 | 1 | Dev | Relevant to older Epic 5, included as regression. |
| 错误提示和空状态：无可收货订单、无可出库数量、筛选无结果。 | E2E/Manual | R-009 | 3 | QA | Manual acceptable before automation. |

**Total P2:** 10 scenario checks, ~7-15 hours.

### P3 (Low)

**Criteria:** Exploratory, benchmarks, nice-to-have validation.

| Requirement | Test Level | Test Count | Owner | Notes |
| --- | --- | ---: | --- | --- |
| 大数据列表滚动/固定列视觉检查。 | Manual/E2E visual | 2 | QA | Useful after real dataset exists. |
| 物流详情装箱信息展示格式和长字段布局。 | Manual | 1 | QA | Lower release risk. |

**Total P3:** 3 checks, ~1-3 hours.

---

## Execution Strategy

Philosophy: run everything in PRs if the full suite stays under 15 minutes; defer only expensive, long-running, or environment-heavy checks.

| Stage | Scope |
| --- | --- |
| PR | P0 API/Jest checks, transaction-chain Playwright smoke when fixture setup is fast, `api build`, `web build`, `git diff --check`. |
| Nightly | Full transaction-chain E2E across all four fulfillment variants, full browser matrix if needed, full API Jest with failure classification. |
| Weekly / Release Candidate | Performance timing checks for confirm actions, larger dataset list/detail checks, exploratory manual business walkthrough. |

Playwright can parallelize enough that dozens of UI checks should still fit PR execution once reliable API seeding exists.

---

## Resource Estimates

| Priority | Count | Effort Range | Notes |
| --- | ---: | --- | --- |
| P0 | 9 grouped tests | ~20-35 hours | Data setup and cross-document assertions are the hard part. |
| P1 | 14 grouped tests | ~18-30 hours | Mostly API + focused UI assertions. |
| P2 | 10 grouped tests | ~7-15 hours | Secondary flows and edge cases. |
| P3 | 3 checks | ~1-3 hours | Manual/exploratory acceptable. |
| **Total** | **36 grouped checks** | **~46-83 hours** | ~1.5-2.5 weeks depending on fixture maturity. |

### Prerequisites

**Test Data:**

- Sales order fixture with multiple SKU lines.
- Inventory fixture supporting full-stock, full-purchase, mixed-stock-purchase, and partial-shipment paths.
- Master data fixture for supplier, contract term, warehouse, company, ports, logistics provider, and customer.
- Cleanup by generated codes / request keys to keep tests parallel-safe.

**Tooling:**

- Jest for module-level API/service tests.
- Playwright for browser E2E and API-driven fixture setup.
- Optional k6 or equivalent later for confirm-action performance thresholds.

**Environment:**

- Local or staging environment with MySQL migrations applied.
- Web app served at Playwright base URL `http://localhost:5173`.
- API served behind `/api`.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100%.
- **P1 pass rate:** >=95%; failures require explicit waiver.
- **P2/P3 pass rate:** >=90% informational.
- **High-risk mitigations:** all R-001 through R-005 must be mitigated or waived before release.

### Coverage Targets

- **Critical path:** >=80% automated coverage across API and E2E.
- **Data integrity scenarios:** 100% for receipt, lock, outbound, sourceActionKey idempotency.
- **Security/auth scenarios:** 100% for unauthenticated negative checks on transaction endpoints.
- **Business logic:** >=70% for state transition and partial quantity branches.

### Non-Negotiable Requirements

- [ ] All P0 tests pass.
- [ ] No unmitigated risk score >=6 remains open.
- [ ] Inventory transaction evidence exists for receipt, lock, outbound.
- [ ] No test asserts completion based only on downstream document existence; assertions must use quantity facts.
- [ ] Full NFR PASS/CONCERNS/FAIL decision is deferred to `bmad-testarch-nfr` after evidence exists.

---

## Mitigation Plans

### R-001: Cross-document quantity inconsistency (Score: 6)

**Mitigation Strategy:** Add full-chain API/E2E tests with assertions across allocation, inventory summary/batch, inventory transactions, demand items, logistics items, outbound items, and sales order display cache.
**Owner:** QA + Dev
**Timeline:** Before MVP release decision
**Status:** Planned
**Verification:** P0 chain tests pass and produce CI artifacts.

### R-002: State machine regression to old document口径 (Score: 6)

**Mitigation Strategy:** Encode flow document transitions into test names and assertions; prohibit status changes through generic PATCH in negative tests.
**Owner:** Dev Lead
**Timeline:** Before MVP release decision
**Status:** Planned
**Verification:** State transition tests cover allocation, purchase, receipt, outbound, and detail display.

### R-003: Idempotency failure in confirm actions (Score: 6)

**Mitigation Strategy:** Re-submit the same requestKey/sourceActionKey for purchase creation, receipt confirmation, and outbound confirmation; assert no duplicate purchase order, allocation, transaction, outbound consumption, or log pollution.
**Owner:** Dev
**Timeline:** Before MVP release decision
**Status:** Planned
**Verification:** Targeted API/Jest tests pass.

### R-004: Partial fulfillment displayed as complete (Score: 6)

**Mitigation Strategy:** Build partial receipt and partial shipment fixture paths; assert API status, FlowProgress, SmartButton counts, and detail tags remain aligned.
**Owner:** QA + PM
**Timeline:** Before MVP release decision
**Status:** Planned
**Verification:** P0/P1 partial path tests pass and manual walkthrough signs off.

### R-005: Confirm action performance/feedback gap (Score: 6)

**Mitigation Strategy:** Add API timing checks for receipt and outbound confirmation; collect p95/p99 when staging data exists. Until baseline exists, treat threshold evidence as UNKNOWN.
**Owner:** QA + DevOps
**Timeline:** Release candidate
**Status:** Planned
**Verification:** NFR evidence artifact or documented waiver for `nfr-assess`.

---

## Assumptions and Dependencies

### Assumptions

1. Current flow documents are the authoritative oracle when older PRD/Epic language conflicts.
2. API-level fixture seeding is acceptable for E2E tests; not every setup action needs to happen through UI.
3. Existing module-level Jest tests are retained and can be used as regression evidence.

### Dependencies

1. Stable test database reset/cleanup strategy.
2. Auth/session fixture for Playwright.
3. Master data seed set for transaction modules.
4. Full API Jest failure classification from the known historical debt.

### Risks to Plan

- **Risk:** Fixture setup becomes slower than the tested user flow.
  - **Impact:** E2E suite becomes flaky or too expensive for PRs.
  - **Contingency:** Use API factories and reserve full browser journey for one or two smoke paths.

---

## Follow-on Workflows (Manual)

- Run `bmad-qa-generate-e2e-tests` to implement the P0/P1 automation plan.
- Run `bmad-testarch-nfr` after timing/security/reliability evidence exists.
- Run `bmad-testarch-trace` once tests are implemented, to map AC/risk coverage to gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: Friday Date: 2026-05-28
- [ ] Tech Lead: TBD Date:
- [ ] QA Lead: TBD Date:

**Comments:**

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
| --- | --- | --- |
| `shipping-demands` | Fulfillment hub, allocation, status and display counts. | Generate demand, confirm allocation, detail aggregation, FlowProgress. |
| `purchase-orders` | Requisition PO creation and confirmation state chain. | Prefill, create from demand, idempotency, internal/supplier confirmation. |
| `receipt-orders` | Receipt confirmation, inventory increase, purchase receipt status, auto-lock trigger. | Remaining quantity validation, partial/full receipt, duplicate confirm. |
| `inventory` | Quantity authority and transaction audit. | Summary/batch deltas, lock/unlock/outbound transactions, sourceActionKey. |
| `logistics-orders` | Logistics plan based on locked quantity and status display. | Create limit, list/detail, tracking update, shipped transition. |
| `outbound-orders` | Allocation consumption and upstream status linkage. | Partial/full outbound, allocation consumption, status/log updates. |
| `sales-orders` | Upstream display cache and final shipment state. | Prepared/shipped cache, partial/full shipped status. |
| `apps/web` transaction pages | Operator-visible confirmation of state and counts. | E2E smoke for demand, purchase, receipt, logistics, outbound, final detail pages. |

---

## Appendix

### Knowledge Base References

- `risk-governance.md`
- `probability-impact.md`
- `test-levels-framework.md`
- `test-priorities-matrix.md`
- `nfr-criteria.md`
- `playwright-cli.md`

### Existing Evidence

- Directed API/Jest tests exist for shipping demands, purchase orders, receipt orders, logistics orders, outbound orders, and inventory.
- Web Playwright configuration exists, but current E2E coverage is limited to users management.
- Epic 6-8 retro identifies A1 end-to-end acceptance script and A2 full API Jest failure classification as critical path items.

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Flow trigger chain: `_bmad-output/planning-artifacts/flow-cross-document-trigger.md`
- State machine: `_bmad-output/planning-artifacts/flow-state-machine.md`
- Quantity lineage: `_bmad-output/planning-artifacts/flow-quantity-data-lineage.md`
- Retro: `_bmad-output/implementation-artifacts/epic-6-8-retro-2026-05-27.md`

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `bmad-testarch-test-design`
**Version:** 4.0 (BMad v6)

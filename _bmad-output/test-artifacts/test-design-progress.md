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
status: 'completed'
outputFile: '/Users/chenkangping/ai_study/infitek_erp/_bmad-output/test-artifacts/test-design-epic-6-8.md'
mode: 'epic-level'
epic: 'Epic 6-8 主履约交易链'
inputDocuments:
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/project-context.md
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/implementation-artifacts/sprint-status.yaml
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/implementation-artifacts/epic-6-8-retro-2026-05-27.md
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/planning-artifacts/flow-cross-document-trigger.md
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/planning-artifacts/flow-state-machine.md
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/planning-artifacts/flow-quantity-data-lineage.md
---

# Epic 6-8 测试设计进度

## Step 1: 模式检测

**选择的模式:** Epic-Level Test Design

**原因:** 当前目标是对已完成的 Epic 6-8 主履约交易链做发布前质量收口。`sprint-status.yaml` 存在，Epic 6-8 story 均已完成，且最新 retro 明确建议先建立端到端业务验收脚本，而不是继续新 Epic。

## Step 2: 上下文加载

### 已加载输入

- `_bmad-output/project-context.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/epic-6-8-retro-2026-05-27.md`
- `_bmad-output/planning-artifacts/flow-cross-document-trigger.md`
- `_bmad-output/planning-artifacts/flow-state-machine.md`
- `_bmad-output/planning-artifacts/flow-quantity-data-lineage.md`
- Epic 6-8 关键 story AC：6.2、6.3、6.5、6.6、7.1、7.3、7.4、8.1
- TEA 知识片段：risk-governance、probability-impact、test-levels-framework、test-priorities-matrix、nfr-criteria、playwright-cli

### 现有覆盖观察

- 后端已有交易模块定向 Jest 测试：shipping-demands、purchase-orders、receipt-orders、logistics-orders、outbound-orders、inventory。
- 前端 Playwright 配置存在，但当前 E2E 主要覆盖用户管理，尚未覆盖 Epic 6-8 主交易链。
- `playwright-cli` 未安装；未执行浏览器探索。

## Step 3: 风险和可测试性分析

识别 9 个风险，其中 5 个高优先级风险：

- R-001 跨单据数量事实不一致。
- R-002 状态机回归到旧文档口径。
- R-003 幂等键或重复提交导致重复业务事实。
- R-004 部分采购/收货/发货被错误展示为完成。
- R-005 收货/出库确认 3 秒反馈要求缺少最终证据。

## Step 4: 覆盖计划

定义 P0/P1/P2/P3 覆盖矩阵：

- P0 聚焦全库存、全采购、部分采购、部分收货、部分出库、全出库、幂等和库存流水。
- P1 聚焦真实计数、SmartButton、ActivityTimeline、动作端点、错误提示和详情页一致性。
- P2/P3 聚焦列表筛选、物流跟踪、作废回归、空状态和视觉检查。

## Step 5: 输出生成

已生成最终测试设计：

- `/Users/chenkangping/ai_study/infitek_erp/_bmad-output/test-artifacts/test-design-epic-6-8.md`

## Completion Report

**Mode used:** Epic-Level

**Key gates:**

- P0 pass rate = 100%
- P1 pass rate >= 95%
- High-risk mitigations R-001 through R-005 must be complete or waived before release
- Full NFR evidence decision deferred to `bmad-testarch-nfr`

**Open assumptions:**

- Role/permission matrix尚未明确。
- 性能基线除 3 秒动作反馈要求外仍为 UNKNOWN。
- 需要后续用 `bmad-qa-generate-e2e-tests` 落地自动化测试。

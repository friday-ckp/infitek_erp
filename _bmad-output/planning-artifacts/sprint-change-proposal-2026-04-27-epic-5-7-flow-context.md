# Sprint Change Proposal — Epic 5-7 后续 Story 强制 Flow 上下文固化

**项目：** infitek_erp  
**日期：** 2026-04-27  
**提案人：** Correct Course Agent  
**审阅人：** friday  
**状态：** Applied（按用户触发执行，待后续显式验收）  
**执行模式：** Batch

---

## Section 1: Issue Summary

### 问题陈述

Epic 5-7 正在进入跨单据交易链路开发：销售订单、发货需求、采购订单、收货入库、物流单、发货出库与库存双层结构会在多个 Story 中连续落地。项目已在 2026-04-26/2026-04-27 形成三份最新 flow 文档：

- `_bmad-output/planning-artifacts/flow-cross-document-trigger.md`
- `_bmad-output/planning-artifacts/flow-state-machine.md`
- `_bmad-output/planning-artifacts/flow-quantity-data-lineage.md`

但这三份文档尚未被固化为 Epic 5-7 后续 Story 的强制上下文。若后续 `create-story` 或 `dev-story` 只读取旧 PRD、旧 Architecture、Epic 文本或前置 Story，很容易出现以下偏差：

- 跨单据触发时机回到旧描述，例如自动生成发货需求、创建即确认等。
- 状态机枚举和动作端点与最新状态图不一致。
- 数量字段各单据各自写入，导致销售订单、发货需求、采购、收货、出库和库存数量口径不一致。
- 重复确认缺少幂等键，造成库存和数量重复累加。
- 出库绕过发货需求库存分配表，只按全局库存或物流单数量扣减。

### 触发 Story

无单一触发 Story。本次是跨 Epic 的上下文治理变更，影响尚未开始或尚未创建的后续 Story：

- Epic 5：5.0、5.2、5.3、5.4、5.5
- Epic 6：6.2、6.3、6.4、6.5、6.6
- Epic 7：7.1、7.2、7.3、7.4

### 支撑证据

- `flow-cross-document-trigger.md` 已明确 Epic 5-7 端到端触发链：销售订单审核通过后手动生成发货需求，发货需求集中确认履行类型，采购收货后自动锁定，物流与出库确认后联动状态。
- `flow-state-machine.md` 已明确销售订单、发货需求、采购订单、物流单和出库单状态机。
- `flow-quantity-data-lineage.md` 已明确数量权威来源、库存分配表、库存流水 delta 字段、幂等键、领域动作服务和上游数量缓存回填规则。
- `workflow/story-dev-workflow-single-repo.md` 原先只要求读取 `project-context.md`，没有针对 Epic 5-7 的三份 flow 文档守门。
- `bmad-create-story` 原先只把 PRD、Architecture、UX、Epics 作为输入，没有把 `flow-*.md` 设为 Epic 5-7 story 的强制输入。
- `bmad-dev-story` 原先只信 story 文件 Dev Notes，没有对 Epic 5-7 缺失 flow 上下文时停止实现的机制。

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | 影响 | 结论 |
|------|------|------|
| Epic 5 | 发货需求生成、库存决策、库存锁定、作废与重新生成均依赖三份 flow 文档。 | 必须在 Epic 概述和 story 创建/开发流程中固化。 |
| Epic 6 | 请购型采购、收货入库、库存流水、收货后自动锁定都依赖数量权威来源和状态机。 | 必须继承三份 flow 文档，避免重复库存模型或错误回填。 |
| Epic 7 | 物流计划数量、出库校验、库存扣减释放、状态联动依赖分配表和触发链。 | 必须以三份 flow 文档裁决旧描述冲突。 |
| Epic 8 | 状态自动流转依赖 Epic 5-7 已按 flow 文档正确落地。 | 本次不直接改 Epic 8，但会降低后续自动流转风险。 |

### Story Impact

| Story 范围 | 当前风险 | 调整 |
|-----------|----------|------|
| 5.0、5.2-5.5 | 可能只按 Epic AC 做局部实现，遗漏数量权威、幂等、回填和跨单据触发。 | 创建/开发前强制加载三份 flow 文档。 |
| 6.2-6.6 | 可能把库存流水简化成单一 `quantity_change`，或收货后只改库存不回填发货需求/销售订单。 | 以 `flow-quantity-data-lineage.md` 作为数量模型与事务边界权威。 |
| 7.1-7.4 | 可能物流计划超出已锁定数量，出库按仓库可用库存扣减而非本需求锁定量。 | 以分配表和状态机规则作为实现门禁。 |

### Artifact Conflicts

| Artifact | 冲突点 | 处理 |
|----------|--------|------|
| PRD | 早期章节仍含简版状态机、部分旧流程口径。 | 三份 flow 文档作为旧 PRD 冲突裁决依据。 |
| Architecture | 早期架构正文存在旧状态/库存表达，最新数量 lineage 是补充架构决策。 | `project-context.md` 明确三份 flow 优先级。 |
| UX | UX 强调发货需求枢纽体验，但不覆盖所有幂等和数量回填细节。 | Story Dev Notes 必须补充 flow 技术约束。 |
| Epics | Epic 5-7 有 AC，但未强制 story 创建时加载 flow 文档。 | 在 Epic 5-7 概述插入强制上下文说明。 |
| Workflow | create-story/dev-story/start-story 缺少强制守门。 | 修改对应 workflow。 |
| sprint-status | 开发队列视角看不到 flow 上下文门禁。 | 增加 workflow notes。 |

### Technical Impact

- 无业务代码变更。
- 变更类型为流程和文档固化，影响后续 Story 生成质量和开发守门。
- 后续 Epic 5-7 story 文件必须显式记录已加载三份 flow 文档。
- 后续开发若缺失 flow 文档或 story Dev Notes 未包含相关上下文，应在编码前停止。

---

## Section 3: Recommended Approach

### 推荐路径：Direct Adjustment

直接调整现有规划与 BMAD 本地 workflow，不新增 Epic、不回滚已完成 Story、不改变 MVP 业务范围。

### 推荐理由

1. **改动小但约束硬**：只改文档和 workflow，即可覆盖后续 create-story、start-story、dev-story 三个入口。
2. **不影响已完成工作**：Story 5.1 已完成，本次不要求返工，只约束后续 Story。
3. **降低跨单据错实现风险**：三份 flow 文档同时覆盖触发链、状态机和数量 lineage，能解决单一文档无法裁决冲突的问题。
4. **适合当前时点**：Epic 5 后续和 Epic 6/7 尚未开始，最适合在实现前固化。

### 替代方案评估

| 方案 | 结论 | 原因 |
|------|------|------|
| 只在最终回复提醒开发者 | 不推荐 | 不可追踪，跨会话后容易丢失。 |
| 只改 `epics.md` | 不足 | create-story 可能读到，但 dev-story 无守门。 |
| 只改 `project-context.md` | 不足 | story 文件可能不显式带上三份 flow，开发者仍可能漏读。 |
| 新增一个 Epic 做流程治理 | 不推荐 | 这是上下文约束，不是用户价值交付 Epic。 |

### 工作量与风险

- **工作量估算**：Low。
- **风险等级**：Low。只涉及文档和本地 BMAD workflow。
- **时间影响**：后续每个 Epic 5-7 story 创建时需要多读三份文档，但可显著减少返工。

---

## Section 4: Detailed Change Proposals

### Proposal 1 — Epics：Epic 5-7 增加强制上下文说明

**Artifact**：`_bmad-output/planning-artifacts/epics.md`

**OLD**

```markdown
## Epic 5: 销售订单与发货需求管理

销售员可以按已落地状态机创建销售订单...
```

**NEW**

```markdown
> **强制上下文（Epic 5-7 后续 Story 必读）**：自 2026-04-27 起，创建或开发 Epic 5-7 的任何后续 Story（包括 5.0、5.2-5.5、6.2-6.6、7.1-7.4）时，必须先加载并在 Story Dev Notes 中引用：
> - `_bmad-output/planning-artifacts/flow-cross-document-trigger.md`
> - `_bmad-output/planning-artifacts/flow-state-machine.md`
> - `_bmad-output/planning-artifacts/flow-quantity-data-lineage.md`
>
> 若 PRD、Architecture、UX 或旧 Story 描述与上述三份 flow 文档冲突，以三份 flow 文档为准...
```

**Rationale**

Epic 是 story 的源头，必须在 Epic 层把强制上下文写成源需求。

### Proposal 2 — Project Context：加入全局 AI Agent 守则

**Artifact**：`_bmad-output/project-context.md`

**NEW**

```markdown
### Epic 5-7 交易流强制上下文（关键）

- 创建或开发 Epic 5-7 后续 Story（5.0、5.2-5.5、6.2-6.6、7.1-7.4）前，必须加载三份 flow 文档。
- 若 PRD、Architecture、UX、旧 Epic 文本或已完成 Story 与上述三份 flow 文档冲突，以三份 flow 文档为准。
- 发货需求是履约数量权威单据；库存数量权威来源是 inventory_summary、inventory_batch、库存分配表和库存流水...
```

**Rationale**

`project-context.md` 是 dev agent 必读规则，适合放冲突裁决和实现禁区。

### Proposal 3 — Create Story Workflow：Epic 5-7 创建时强制加载 flow

**Artifact**：`.agents/skills/bmad-create-story/workflow.md`

**NEW**

```markdown
For Epic 5-7 stories, load flow-cross-document-trigger.md, flow-state-machine.md, and flow-quantity-data-lineage.md completely. Treat them as mandatory, conflict-resolving context...
```

并要求生成 Story 时加入 `Epic 5-7 Mandatory Flow Context` Dev Notes 小节。

**Rationale**

让后续 story 文件自身携带上下文，不依赖开发阶段再次猜测。

### Proposal 4 — Dev Story Workflow：缺失 flow 上下文时停止实现

**Artifact**：`.agents/skills/bmad-dev-story/workflow.md`

**NEW**

```markdown
Epic 5-7 stories require mandatory transaction flow context before implementation.
Verify Dev Notes contains `Epic 5-7 Mandatory Flow Context` or explicit references to all three mandatory flow files...
HALT if missing.
```

**Rationale**

防止已经生成但缺少 flow 上下文的 story 直接进入编码。

### Proposal 5 — Start Story Workflow 与 Sprint Status：入口处可见

**Artifacts**：

- `workflow/story-dev-workflow-single-repo.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

**NEW**

- `start story` prerequisites 增加 Epic 5-7 三份 mandatory flow 文档。
- Step 2 后检查 story Dev Notes 是否包含 `Epic 5-7 Mandatory Flow Context`。
- Step 3 开发前要求以三份 flow 文档作为冲突裁决。
- sprint-status workflow notes 标记 Epic 5-7 story 的 mandatory flow context。

**Rationale**

让人工从 sprint 队列和 start-story 入口都能看到门禁。

---

## Section 5: Implementation Handoff

### Scope Classification

**Minor / Direct Adjustment**：可由 Developer Agent 直接实现。无需 PM/Architect 重新规划，无需调整 MVP 范围，无需重排 Epic。

### 已应用工件

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/project-context.md`
- `.agents/skills/bmad-create-story/workflow.md`
- `.agents/skills/bmad-dev-story/workflow.md`
- `workflow/story-dev-workflow-single-repo.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-27-epic-5-7-flow-context.md`

### 后续执行规则

- 下一次创建 Epic 5-7 story 时，story 文件必须包含 `Epic 5-7 Mandatory Flow Context` 或等价小节。
- 下一次开发 Epic 5-7 story 时，若 story Dev Notes 未包含三份 flow 文档引用，应先修 story 上下文，不得直接实现。
- code review 时应检查实现是否遵守三份 flow 文档，尤其是：状态动作端点、数量权威来源、库存分配表、幂等键、事务边界和上游回填。

### Success Criteria

- 后续 Epic 5-7 story 文件全部显式引用三份 flow 文档。
- 后续实现不再出现旧状态机、临时库存 API、重复枚举、直接 PATCH 状态、绕过分配表扣库存等偏差。
- Cross-document trigger、state machine、quantity lineage 三类规则能在 story 创建、开发和 review 三个阶段被持续检查。

---

## Checklist Results

| Checklist Item | Status | Notes |
|----------------|--------|-------|
| 1.1 Identify trigger | [x] | 跨 Epic 上下文治理，无单一触发 Story。 |
| 1.2 Define core problem | [x] | 三份 flow 文档未固化为后续 Story 强制上下文。 |
| 1.3 Supporting evidence | [x] | 已核对 flow 文档、epics、project-context、create/dev/start workflow、sprint-status。 |
| 2.1 Current epic impact | [x] | Epic 5 后续 Story 直接受影响。 |
| 2.2 Epic-level changes | [x] | Epic 5-7 概述加入强制上下文。 |
| 2.3 Future epics impact | [x] | Epic 6/7 后续 Story 必须继承。 |
| 2.4 New/obsolete epics | [N/A] | 不新增、不移除 Epic。 |
| 2.5 Priority/order | [N/A] | 不改变 story 顺序。 |
| 3.1 PRD conflicts | [x] | 三份 flow 文档作为旧 PRD 冲突裁决依据。 |
| 3.2 Architecture conflicts | [x] | quantity lineage 作为架构补充优先。 |
| 3.3 UI/UX conflicts | [x] | UX 不需大改，但 story Dev Notes 必须补技术约束。 |
| 3.4 Other artifacts | [x] | 已覆盖 create-story/dev-story/start-story/sprint-status。 |
| 4.1 Direct adjustment | [x] | Viable，Low effort / Low risk。 |
| 4.2 Rollback | [N/A] | 不需要回滚。 |
| 4.3 MVP review | [N/A] | 不改变 MVP 范围。 |
| 4.4 Recommended path | [x] | Direct Adjustment。 |
| 5.1 Issue summary | [x] | 已完成。 |
| 5.2 Impact/artifacts | [x] | 已完成。 |
| 5.3 Recommended path | [x] | 已完成。 |
| 5.4 MVP impact/action plan | [x] | MVP 不变，行动为文档和 workflow 固化。 |
| 5.5 Handoff plan | [x] | Developer Agent 执行。 |
| 6.1 Checklist completion | [x] | 全部适用项完成。 |
| 6.2 Proposal accuracy | [x] | 已与现有 artifact 对齐。 |
| 6.3 User approval | [!] | 用户触发执行；最终验收待用户确认。 |
| 6.4 sprint-status update | [x] | 已新增 workflow note 和 last_updated。 |
| 6.5 Next steps | [x] | 下一次 create/dev Epic 5-7 story 时执行门禁。 |

# Sprint Change Proposal: 钉钉组织用户同步与绑定管理能力补强

Date: 2026-06-01
Project: infitek_erp
Owner: friday
Mode: Batch
Skill: bmad-correct-course

## 1. Issue Summary

Epic 9 已经完成了钉钉扫码登录主链路的绝大部分基础能力，包括：
- 钉钉应用配置与用户模型扩展（9.1）
- 后端 OAuth 回调与本地 JWT 签发（9.2）
- 前端登录页与钉钉回调页（9.3）
- 用户管理中的手工绑定/解绑能力（9.4）

但当前实现仍存在一个明显的运营落差：**管理员必须手工录入 `dingtalkUnionId` 才能完成绑定**。这对于真实企业环境并不友好，因为管理员通常拿到的是“钉钉组织中的员工列表”，而不是一串内部身份主键。

本次变更触发点不是“现有扫码登录不可用”，而是“现有绑定维护模式无法支撑真实组织级上线”：
- 缺少“从钉钉组织同步用户到 ERP”的能力
- 缺少独立的“钉钉用户池 / 待处理池”
- 缺少基于手机号、邮箱、工号的 ERP 用户匹配建议
- 缺少“候选 / 冲突 / 已绑定 / 未绑定”的运营状态管理
- 缺少“管理员先同步、再确认绑定、再处理冲突”的完整后台工作流

因此，本次需求更准确地说是：**在现有 Epic 9 的“扫码登录 + 手工绑定”基础上，升级为“组织用户同步 + 候选匹配 + 后台绑定运营”方案。**

支持证据：
- 当前后端钉钉能力仅覆盖 OAuth 登录用户自身身份获取：`apps/api/src/modules/auth/dingtalk-auth.client.ts`
- 当前用户绑定模型直接挂在 `users` 表上，仅支持单用户手工维护：`apps/api/src/modules/users/entities/user.entity.ts`
- 当前 9.4 已交付的是“手工录入 UnionID 绑定”模式，而非“从钉钉组织同步待绑定池”：`_bmad-output/implementation-artifacts/9-4-用户管理钉钉绑定能力.md`
- 当前 `sprint-status.yaml` 显示 Epic 9 已进入后期验收，说明这次更适合作为 **Epic 9 的范围补强 / 后续子故事**，而不是重开一套平行认证 Epic：`_bmad-output/implementation-artifacts/sprint-status.yaml`

问题归类：
- 类型：**已实现功能与真实业务运营方式之间的能力缺口**
- 范围：**认证周边后台运营能力扩展**
- 结论：这不是推翻 Epic 9，而是对 Epic 9 进行中后段范围升级

## 2. Checklist Findings

| Checklist Item | Status | Finding |
|---|---|---|
| 1.1 Triggering story | Done | 触发点不是某个 story 失败，而是 Epic 9 现有“手工绑定”方案不满足真实管理员使用场景。 |
| 1.2 Core problem | Done | 当前只能手工录入身份主键绑定，无法从组织通讯录同步并辅助匹配。 |
| 1.3 Evidence | Done | 现有实现只覆盖 OAuth 登录、手工绑定/解绑，无独立钉钉用户池或同步接口。 |
| 2.1 Current epic impact | Done | Epic 9 已有能力保留，不需要回滚。 |
| 2.2 Epic-level changes | Action-needed | 建议扩展 Epic 9 目标描述与 stories，而不是新开重复 Epic。 |
| 2.3 Remaining epics impact | Done | Epic 1-8 不受影响；主要影响 Epic 9 的后续排期与收尾验收。 |
| 2.4 New epic need | N/A | 不建议新增 Epic 10 来承接同一身份主题，避免规划割裂。 |
| 2.5 Priority/order | Done | 该能力应在 Epic 9 正式收尾前纳入 backlog，否则扫码登录上线仍高度依赖手工技术支持。 |
| 3.1 PRD conflict | Action-needed | 当前 FR-A04/FR-A05 只覆盖扫码登录与手工绑定，不覆盖组织同步、候选匹配、冲突处理。 |
| 3.2 Architecture conflict | Action-needed | 当前架构只定义“用户表挂载钉钉字段”，不足以表达“钉钉用户池/同步快照/匹配状态”模型。 |
| 3.3 UI/UX conflict | Action-needed | 当前 UX 只覆盖登录页与用户详情绑定区块，未覆盖管理员的同步与冲突处理后台流程。 |
| 3.4 Other artifacts | Action-needed | `epics.md`、`sprint-status.yaml`、Epic 9 验收记录、后续故事文件均需调整。 |
| 4.1 Direct adjustment | Viable | 通过扩展 Epic 9、增加 2-4 个后续 stories 可以落地。Effort: Medium-High。Risk: Medium。 |
| 4.2 Rollback | Not viable | 回滚现有 9.1-9.4 没有价值，现有扫码登录与手工绑定仍是新能力的底座。 |
| 4.3 MVP review | Viable | 如需控 scope，可先做“手动同步 + 单条确认绑定 + 冲突处理”，暂不做全自动绑定或批量自动开户。 |
| 4.4 Recommended path | Done | 选择 Direct Adjustment，并明确保持“不自动开户、不自动绑定”的原则。 |
| 5.1-5.5 Proposal components | Done | 本提案已给出 PRD / Architecture / UX / Epic / Story / sprint-status 变更建议。 |
| 6.1-6.2 Final review | Done | 已按 Batch 模式整理为一次性评审版本。 |
| 6.3 Approval | Action-needed | 需你批准后，再更新正式规划文档和 sprint-status。 |
| 6.4 sprint-status update | N/A before approval | 批准前不改正式 `sprint-status.yaml`。 |

## 3. Impact Analysis

### Epic Impact

| Epic | Impact | Required Change |
|---|---|---|
| Epic 9: 企业 SSO 与钉钉扫码登录 | 目标范围需要从“扫码登录 + 手工绑定”扩展到“同步组织用户 + 生成绑定候选 + 管理冲突”。 | 更新 Epic 9 描述与 stories。 |
| Story 9.4: 用户管理钉钉绑定能力 | 已实现，但边界偏窄，仅支持手工录入身份字段。 | 保留既有交付；将其重新定位为“基础手工绑定能力”。 |
| Story 9.5: 联调测试与上线校验 | 当前验收标准不足以覆盖“同步用户池、候选确认、冲突处理、解绑后重新匹配”链路。 | 验收标准需要扩展或拆出后续 story 后再做最终收尾。 |

### Artifact Conflicts

| Artifact | Conflict | Change Needed |
|---|---|---|
| `prd.md` | 只覆盖扫码登录与绑定/解绑，没有同步池与候选匹配。 | 增补新的功能需求条目。 |
| `architecture.md` | 当前身份模型以 `users` 表为主，缺少钉钉同步池、同步任务、匹配状态的设计。 | 增补“钉钉组织用户池”与匹配规则模型。 |
| `ux-design-specification.md` / `ux-spec.md` | 当前未定义管理员同步、候选确认、冲突处理界面。 | 新增后台运营流程与状态定义。 |
| `epics.md` | Epic 9 的 story 颗粒度尚未覆盖该运营能力。 | 新增后续 story 或重排 9.5 之后的子故事。 |
| `sprint-status.yaml` | 当前 Epic 9 接近 done/in-progress 末尾，不反映新增工作。 | 批准后把新增 story 加入 backlog。 |

### Technical Impact

后端：
- 需要新增“钉钉组织用户池”数据模型，建议与 `users` 表分离，避免把未绑定外部人员直接塞进本地用户表
- 需要新增同步接口或同步任务，调用钉钉组织/通讯录相关 API 拉取用户
- 需要新增匹配建议逻辑，按手机号、邮箱、工号等字段对 ERP 用户做候选归并
- 需要新增绑定确认、冲突标记、解绑后的状态回流逻辑

数据模型：
- 当前 `users.dingtalk_*` 字段仍保留，继续作为“最终已绑定结果”的承载点
- 但应新增独立表，例如 `dingtalk_org_users` 或等价名称，承载：
  - 钉钉用户原始身份
  - 同步时间
  - 建议匹配的 ERP 用户
  - 绑定状态与冲突状态
  - 匹配依据快照

前端：
- 需要新增“钉钉用户同步与绑定管理”后台入口
- 需要新增列表、筛选、详情抽屉/弹窗，支持状态查看、建议确认、手动绑定、解绑、冲突处理
- 原用户详情中的手工绑定区块可保留，作为兜底入口

测试与验收：
- 需要新增同步接口/service 测试
- 需要新增匹配策略测试
- 需要新增管理页面与主要操作链路 E2E/页面测试
- Story 9.5 的最终上线结论应依赖这些能力完成后再更新

## 4. Recommended Approach

推荐路径：**Direct Adjustment**

范围分类：**Moderate to Major**

理由：
- 现有 Epic 9 已建立稳定的认证底座，最合理的做法是在其上继续增强，而不是另起一套 SSO 主题
- 用户提出的目标本质上是“绑定运营能力产品化”，它天然属于 Epic 9 的后半程
- 继续沿用“钉钉只做外部认证，ERP 本地用户仍是权限主体”的原则，可以最大化复用现有认证边界
- 保持“不自动开户、不自动绑定”可以显著降低误绑风险，也符合当前业务约束

推荐控制范围：
- 第一阶段只做：
  - 手动同步钉钉组织用户
  - 展示钉钉用户池
  - 生成唯一候选建议
  - 管理员确认绑定 / 手动绑定 / 解绑
  - 冲突状态标记与待处理
- 暂不做：
  - 自动开户
  - 自动绑定
  - 大规模批量自动确认
  - 多组织/多租户复杂同步策略

## 5. Detailed Change Proposals

### Proposal A — PRD 更新

Target: `_bmad-output/planning-artifacts/prd.md`

Section: `0. 用户认证`

OLD:

```md
- **FR-A04**：系统支持通过钉钉扫码完成登录认证；钉钉授权成功后，后端根据绑定关系为本地用户签发系统 JWT；未绑定用户不得直接进入系统，并提示联系管理员完成绑定
- **FR-A05**：系统管理员可在用户管理页面查看钉钉绑定状态，并执行绑定/解绑操作；一个钉钉身份只能绑定一个系统用户
```

NEW:

```md
- **FR-A04**：系统支持通过钉钉扫码完成登录认证；钉钉授权成功后，后端根据绑定关系为本地用户签发系统 JWT；未绑定用户不得直接进入系统，并提示联系管理员完成绑定
- **FR-A05**：系统管理员可在用户管理页面查看钉钉绑定状态，并执行绑定/解绑操作；一个钉钉身份只能绑定一个系统用户
- **FR-A06**：系统管理员可手动触发从钉钉组织同步用户到 ERP，形成钉钉用户池；同步结果包含新增、更新、已失效或待处理信息，并保留最近同步时间
- **FR-A07**：系统基于手机号、邮箱、工号等信息为钉钉用户生成 ERP 用户匹配建议；当存在唯一候选时标记为“候选”，存在多个候选或信息冲突时标记为“冲突”
- **FR-A08**：系统管理员可在钉钉用户池中查看“未绑定 / 候选 / 冲突 / 已绑定”状态，确认绑定、手动绑定、处理冲突或执行解绑；系统不得自动开户，也不得在未确认情况下自动绑定
```

Rationale:
- 把“扫码登录”升级为“可运营的绑定管理能力”，必须进入 PRD 才能支撑后续 story 与验收

### Proposal B — Architecture 更新

Target: `_bmad-output/planning-artifacts/architecture.md`

Section: `认证与安全` / 新增 `钉钉组织同步与绑定运营模型`

OLD:

```md
**外部身份绑定模型：**
- 在 `users` 表增加 `dingtalk_union_id`、`dingtalk_user_id`、`dingtalk_open_id`、`dingtalk_nick`、`dingtalk_avatar`、`dingtalk_bound_at`
- `dingtalk_union_id` 设唯一索引，作为运行时稳定外部身份键
- 后端 OAuth 回调完成后，不直接把系统 JWT 放在 URL 上，而是生成一次性 `loginTicket`
- 前端通过 `ticket` 换取正式 JWT，降低 token 暴露风险
```

NEW:

```md
**外部身份绑定模型：**
- `users` 表继续承载“最终已绑定”的钉钉身份结果：`dingtalk_union_id`、`dingtalk_user_id`、`dingtalk_open_id`、`dingtalk_nick`、`dingtalk_avatar`、`dingtalk_bound_at`
- 新增独立的钉钉组织用户池表（如 `dingtalk_org_users`），用于承载同步得到的钉钉组织用户、匹配建议、状态与同步快照
- `dingtalk_org_users` 记录至少包括：
  - 钉钉稳定身份键（优先 `unionId`）
  - 钉钉侧展示信息（昵称、手机号、邮箱、工号、部门等最小必要字段）
  - 建议匹配 ERP 用户 ID
  - 匹配依据与匹配置信度/命中规则
  - 状态：`UNBOUND` / `CANDIDATE` / `CONFLICT` / `BOUND`
  - 最近同步时间、最近处理时间、处理人
- 最终确认绑定时，才把结果回写到 `users` 表，保持“候选池”和“正式绑定关系”分层
- 后端 OAuth 回调完成后继续只依赖 `users.dingtalk_union_id` 查找正式绑定关系，不直接读取候选池，避免未确认数据进入登录主链路
```

新增说明：

```md
#### 钉钉组织用户同步与匹配策略

- 同步由管理员手动触发，当前阶段不要求定时任务
- 系统从钉钉组织接口拉取用户清单并 upsert 到钉钉用户池
- 匹配建议按可配置优先级执行，首期建议顺序：
  1. 手机号唯一命中
  2. 邮箱唯一命中
  3. 工号唯一命中
- 命中多个本地用户或字段相互矛盾时标记为 `CONFLICT`
- 未命中任何本地用户时标记为 `UNBOUND`
- 即使唯一命中，也只标记为 `CANDIDATE`，仍需管理员确认后才能成为正式绑定
```

Rationale:
- 当前只有最终绑定模型，没有“待绑定外部身份池”，无法支撑同步与冲突处理能力

### Proposal C — UX 更新

Target: `_bmad-output/planning-artifacts/ux-design-specification.md`

Section: 用户管理体验 / 外部身份运营体验

OLD:

```md
- 用户管理页：在列表和详情中展示钉钉绑定状态、绑定时间，并提供绑定/解绑入口
```

NEW:

```md
- 用户管理页：继续展示 ERP 用户的钉钉绑定状态、绑定时间，并保留绑定/解绑兜底入口
- 新增“钉钉用户同步与绑定管理”后台页面或工作区，供管理员执行组织同步与处理待绑定用户
- 页面至少支持以下能力：
  - 一键手动同步钉钉组织用户
  - 查看同步结果与最近同步时间
  - 按状态筛选：未绑定 / 候选 / 冲突 / 已绑定
  - 查看每个钉钉用户的匹配建议与匹配依据
  - 管理员确认绑定、改绑到其他 ERP 用户、解绑
  - 冲突用户标注并待人工处理
- 状态语义：
  - 未绑定：已同步，但未找到或未确认 ERP 用户
  - 候选：系统找到唯一匹配候选，待管理员确认
  - 冲突：匹配到多个候选或关键信息冲突，需人工处理
  - 已绑定：已成功绑定 ERP 用户
```

Rationale:
- 这次新增的不只是接口，而是一个管理员运营流程，必须在 UX 中清晰定义状态和动作

### Proposal D — Epic 9 更新

Target: `_bmad-output/planning-artifacts/epics.md`

OLD:

```md
### Epic 9: 企业 SSO 与钉钉扫码登录
系统在保留现有用户名/密码登录的基础上，引入钉钉扫码登录能力。钉钉只作为外部身份认证提供方，后端完成授权回调、身份匹配与本地 JWT 签发；管理员可在用户管理中维护钉钉绑定关系，未绑定用户不得通过扫码直接进入系统。
```

NEW:

```md
### Epic 9: 企业 SSO、钉钉组织同步与绑定管理
系统在保留现有用户名/密码登录的基础上，引入钉钉扫码登录能力，并补齐管理员侧的钉钉组织用户同步与绑定管理能力。钉钉只作为外部身份认证提供方；ERP 通过组织用户同步形成钉钉用户池，基于手机号、邮箱、工号等信息生成 ERP 用户匹配建议，由管理员确认绑定、处理冲突或解绑。未确认绑定的钉钉身份不得直接通过扫码进入系统。
```

建议在 Epic 9 后续新增 stories：

```md
9-6-钉钉组织用户同步与用户池建模
9-7-ERP 用户匹配建议与冲突状态引擎
9-8-后台钉钉用户池与绑定处理界面
9-9-同步绑定运营联调与验收补强
```

建议 story 定位：

- `9-6`：后端同步接口、数据表、同步结果统计、管理员触发能力
- `9-7`：匹配建议规则、状态流转、绑定确认/冲突处理 service
- `9-8`：前端管理页、状态筛选、候选确认、手动绑定/解绑入口
- `9-9`：围绕新能力的测试、回归、联调和上线检查，必要时合并/替换旧 9.5 的收尾职责

Rationale:
- 这是 Epic 9 的自然延伸，拆成后续 story 比另起 epic 更一致，也更利于复用已完成能力

### Proposal E — Sprint Status 更新建议

Target: `_bmad-output/implementation-artifacts/sprint-status.yaml`

当前现状：

```yaml
epic-9: in-progress
9-1-钉钉应用配置与用户模型扩展: done
9-2-后端钉钉OAuth回调与JWT签发: done
9-3-前端登录页与钉钉回调页: done
9-4-用户管理钉钉绑定能力: done
9-5-联调测试与上线校验: in-progress
```

批准后建议调整为：

```yaml
epic-9: in-progress
9-1-钉钉应用配置与用户模型扩展: done
9-2-后端钉钉OAuth回调与JWT签发: done
9-3-前端登录页与钉钉回调页: done
9-4-用户管理钉钉绑定能力: done
9-5-联调测试与上线校验: backlog
9-6-钉钉组织用户同步与用户池建模: backlog
9-7-ERP 用户匹配建议与冲突状态引擎: backlog
9-8-后台钉钉用户池与绑定处理界面: backlog
9-9-同步绑定运营联调与验收补强: backlog
epic-9-retrospective: optional
```

Rationale:
- 当前 9.5 的“上线验收”依赖新能力完成，否则最终上线仍然需要大量手工技术支持

## 6. Implementation Handoff

建议 scope 分类：**Moderate to Major**

建议 handoff：
- 路由到：**PO / DEV 协同**
- 原因：需要同时更新规划文档、拆分新 stories、再进入开发

推荐实施顺序：
1. 先批准本提案
2. 更新 `prd.md`、`architecture.md`、`ux-design-specification.md`、`epics.md`
3. 调整 `sprint-status.yaml`
4. 创建 `9-6` story 文件，启动后端数据模型与同步能力
5. 再依次推进 `9-7`、`9-8`
6. 最后以 `9-9` 或重置后的 `9-5` 完成新的联调与上线结论

成功标准：
- 管理员不需要手工查找并录入 `dingtalkUnionId`
- 系统中存在清晰的钉钉用户池与同步结果
- 系统能给出唯一候选建议并要求管理员确认
- 冲突与未绑定状态可被可视化处理
- 扫码登录继续只依赖“已确认绑定”的正式关系

## 7. Workflow Summary

- Issue addressed: 钉钉扫码登录已实现基础能力，但缺少组织用户同步与绑定运营能力，无法支撑真实管理员流程
- Change scope: Moderate to Major
- Artifacts affected:
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`
  - `_bmad-output/planning-artifacts/epics.md`
  - `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Recommended route: PO / DEV 协同，先更新规划，再创建后续 stories 进入开发

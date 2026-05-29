# Sprint Change Proposal: 钉钉扫码登录能力引入

Date: 2026-05-29
Project: infitek_erp
Owner: friday
Mode: Batch
Skill: bmad-correct-course

## 1. Issue Summary

当前项目的登录体系已经完成了 MVP 所需的本地账号认证，但仍停留在“用户名 + 密码 + JWT”的单一模式，且登录页保留了默认测试凭据，实际企业使用体验与企业内部身份体系不匹配。

触发变更的问题不是实现失败，而是新的明确业务需求：
- 现网/目标使用场景需要接入钉钉扫码登录
- 当前登录页的“企业 SSO 登录”仍是占位按钮
- 用户管理仅支持本地账号维护，不支持外部身份绑定

支持证据：
- [apps/web/src/pages/login/index.tsx](/Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/web/src/pages/login/index.tsx:1) 默认填充 `admin / Admin@123`，SSO 按钮仅提示“该功能暂未开发”
- [apps/api/src/modules/auth/auth.controller.ts](/Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/api/src/modules/auth/auth.controller.ts:1) 仅有 `POST /auth/login`
- [apps/api/src/modules/auth/auth.service.ts](/Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/api/src/modules/auth/auth.service.ts:1) 仅支持 `username + password`
- 技术调研已明确推荐方案为“企业内部应用 + 网页应用 + 后端 OAuth 回调 + 本地 JWT 签发 + 管理员预绑定”：
  [technical-dingtalk-sso-research-2026-05-29.md](/Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/_bmad-output/planning-artifacts/research/technical-dingtalk-sso-research-2026-05-29.md:1)

问题归类：
- 类型：**新需求由业务方提出**
- 范围：**认证入口、用户数据模型、后台账号管理、登录 UX、测试与环境配置**
- 结论：这不是对既有 Epic 1 的小补丁，而是应作为一组独立 backlog 工作进入后续开发

## 2. Checklist Findings

| Checklist Item | Status | Finding |
|---|---|---|
| 1.1 Triggering story | Done | 无单一失败 story 触发；是在 Epic 1 完成后新增“企业钉钉扫码登录”需求。 |
| 1.2 Core problem | Done | 现有认证能力满足 MVP，但不满足企业身份接入要求。 |
| 1.3 Evidence | Done | 登录页 SSO 未实现；后端仅支持密码登录；用户表无外部身份字段。 |
| 2.1 Current epic impact | Done | Epic 1 已 done，现有功能不需回滚。 |
| 2.2 Epic-level changes | Action-needed | 建议新增一个独立 Epic 9，而不是改写已完成 Epic 1。 |
| 2.3 Remaining epics impact | Done | Epic 2-8 无业务流程失效，但用户入口和账号管理需扩展。 |
| 2.4 New epic need | Done | 需要新增“企业 SSO 与钉钉扫码登录”Epic。 |
| 2.5 Priority/order | Done | 应优先于后续更深的企业协同能力开发，先稳定身份入口。 |
| 3.1 PRD conflict | Action-needed | 现有 PRD 只描述本地账号密码登录，需要补充扫码登录与绑定能力。 |
| 3.2 Architecture conflict | Action-needed | 认证架构、用户表、回调链路、环境变量和接口契约都需更新。 |
| 3.3 UI/UX conflict | Action-needed | 登录页和用户管理页都需增加外部身份绑定流程。 |
| 3.4 Other artifacts | Action-needed | 需更新 `epics.md`、后续新增 story、审批后更新 `sprint-status.yaml`。 |
| 4.1 Direct adjustment | Viable | 通过新增 Epic 和 stories 可落地，无需回滚既有能力。Effort: Medium。Risk: Medium。 |
| 4.2 Rollback | Not viable | 回滚 Epic 1 无收益，还会破坏现有可用登录链路。 |
| 4.3 MVP review | Not viable | 不需要缩减 MVP，只是追加企业认证能力。 |
| 4.4 Recommended path | Done | 选择 Direct Adjustment。 |
| 5.1-5.5 Proposal components | Done | 本文已包含问题、影响、建议路径、具体改动与 handoff。 |
| 6.1-6.2 Final review | Done | Proposal 已按 Batch 模式汇总完成。 |
| 6.3 Approval | Action-needed | 需你批准后，再更新 `epics.md` / `sprint-status.yaml` 并创建 story。 |
| 6.4 sprint-status update | N/A before approval | 批准前不改 `sprint-status.yaml`。 |

## 3. Impact Analysis

### Epic Impact

| Epic | Impact | Required Change |
|---|---|---|
| Epic 1 项目基础设施与用户认证 | 现有密码登录链路继续保留，不回滚。 | 不修改历史完成事实；新增后续 Epic 承接企业扫码登录。 |
| Epic 2-8 | 业务主链路不受影响。 | 无需回滚或重排。 |
| New Epic 9 | 新增企业身份接入能力。 | 承接钉钉 OAuth、账号绑定、登录页改造、测试与联调。 |

### Artifact Conflicts

| Artifact | Conflict | Change Needed |
|---|---|---|
| `prd.md` | FR-A01 ~ FR-A03 仅覆盖本地账号密码登录与账号管理。 | 新增扫码登录与管理员绑定需求。 |
| `architecture.md` | 当前认证章节只定义 `JWT + /auth/login + 无 Refresh Token`。 | 增补“外部身份提供方接入”与回调链路。 |
| `ux-design-specification.md` | 当前只抽象“登录系统”，未定义扫码登录和绑定管理体验。 | 增补登录页双入口和用户管理绑定状态。 |
| `epics.md` | Epic 1 已完成，不适合继续塞入跨端新增需求。 | 新增 Epic 9 与 4-5 个 story。 |
| `sprint-status.yaml` | 当前所有 epic 均 done。 | 批准后新增 `epic-9: backlog` 及对应 story 条目。 |

### Technical Impact

后端：
- `users` 表新增钉钉身份字段与唯一索引
- 新增钉钉 OAuth 回调、登录票据交换接口
- `AuthService` 扩展 `loginByDingtalk()`，但保留 `login(username, password)`
- 增加状态校验、绑定冲突校验、回调 `state` 校验、ticket 过期机制

前端：
- 登录页从“密码登录单入口”升级为“密码登录 + 钉钉扫码登录双入口”
- 新增钉钉回调页
- 用户管理页新增“钉钉绑定状态 / 绑定时间 / 解绑操作”

配置与部署：
- 新增钉钉应用配置项，如 `DINGTALK_CLIENT_ID`、`DINGTALK_CLIENT_SECRET`、`DINGTALK_REDIRECT_URI`、`DINGTALK_FRONTEND_CALLBACK_URI`
- Nginx / 域名配置要保证正式回调地址固定且 HTTPS 可达

测试：
- 后端新增 auth service / controller / callback 测试
- 前端新增登录跳转和 callback 页面测试
- 需要一次真实钉钉测试应用联调

## 4. Recommended Approach

推荐路径：**Direct Adjustment**

范围分类：**Moderate**

理由：
- 现有密码登录链路已经稳定，继续作为兜底登录方式最稳妥
- 业务需求是新增认证方式，而不是推翻现有用户模型
- 技术调研已经收敛出明确方案，新增 Epic 的不确定性可控
- 通过“钉钉认证 + 本地 JWT”模式，可以最大化复用当前 `JwtAuthGuard`、审计字段、`@CurrentUser()` 和全部业务接口

不推荐：
- Rollback：没有必要
- PRD MVP 缩减：没有必要
- 直接把钉钉 token 当系统 token：会污染当前认证边界，也会增加前端安全风险

## 5. Detailed Change Proposals

### Proposal A — PRD 更新

Target: `_bmad-output/planning-artifacts/prd.md`

Section: `0. 用户认证`

OLD:

```md
- **FR-A01**：系统支持多用户账号管理：系统内置初始管理员账号（用户名 + 密码），管理员可在系统设置中创建其他用户账号；MVP 阶段所有账号具有相同的全系统操作权限，无角色分配、无权限差异
- **FR-A02**：用户账号密码以不可逆加密方式存储，不存储明文；用户可在个人设置中修改自己账号的密码；管理员可重置其他账号的密码
- **FR-A03**：系统管理员可在设置页面创建、查看、编辑、停用用户账号（用户名、姓名、账号状态）；停用账号立即失效，持有的 Token 在下次请求时被拒绝；所有业务操作自动记录操作账号，用于审计追踪（created_by / updated_by 字段记录有效用户身份）
```

NEW:

```md
- **FR-A01**：系统支持多用户账号管理：系统内置初始管理员账号（用户名 + 密码），管理员可在系统设置中创建其他用户账号；MVP 阶段所有账号具有相同的全系统操作权限，无角色分配、无权限差异
- **FR-A02**：用户账号密码以不可逆加密方式存储，不存储明文；用户可在个人设置中修改自己账号的密码；管理员可重置其他账号的密码
- **FR-A03**：系统管理员可在设置页面创建、查看、编辑、停用用户账号（用户名、姓名、账号状态）；停用账号立即失效，持有的 Token 在下次请求时被拒绝；所有业务操作自动记录操作账号，用于审计追踪（created_by / updated_by 字段记录有效用户身份）
- **FR-A04**：系统支持通过钉钉扫码完成登录认证；钉钉授权成功后，后端根据绑定关系为本地用户签发系统 JWT；未绑定用户不得直接进入系统，并提示联系管理员完成绑定
- **FR-A05**：系统管理员可在用户管理页面查看钉钉绑定状态，并执行绑定/解绑操作；一个钉钉身份只能绑定一个系统用户
```

Rationale:
- 该需求已经超出“本地账号密码登录”范畴，必须进入 PRD，避免后续 story 缺乏需求依据

### Proposal B — Architecture 更新

Target: `_bmad-output/planning-artifacts/architecture.md`

Section: `认证与安全`

OLD:

```md
| Token 策略 | Access Token（8h，无 Refresh Token） | 直接满足 NFR-S3 8h 自动登出，Token 到期即强制登出，实现最简；ERP 内部系统无需 Refresh Token |
| 密码加密 | bcrypt（rounds=12） | 满足 NFR-S2 不可逆存储，rounds=12 为安全/性能平衡点 |
| 接口鉴权 | NestJS `JwtAuthGuard` 全局注册，白名单豁免 `/auth/login` | 满足 NFR-S4 全接口鉴权，无遗漏风险 |
```

NEW:

```md
| Token 策略 | Access Token（8h，无 Refresh Token） | 继续作为系统内部统一登录态；密码登录与钉钉扫码登录最终都签发同一种系统 JWT |
| 密码加密 | bcrypt（rounds=12） | 满足 NFR-S2 不可逆存储，rounds=12 为安全/性能平衡点 |
| 外部身份接入 | 钉钉 OAuth2（企业内部应用 + 网页应用能力） | 钉钉只负责身份认证，系统继续维护本地用户与权限语义 |
| 接口鉴权 | NestJS `JwtAuthGuard` 全局注册，白名单豁免 `/auth/login`、`/auth/dingtalk/callback`、`/auth/dingtalk/exchange` | 满足 NFR-S4 全接口鉴权，无遗漏风险 |
```

新增说明：

```md
#### 外部身份绑定模型

- 在 `users` 表增加 `dingtalk_union_id`、`dingtalk_user_id`、`dingtalk_open_id`、`dingtalk_nick`、`dingtalk_avatar`、`dingtalk_bound_at`
- `dingtalk_union_id` 设唯一索引，作为运行时稳定外部身份键
- 后端 OAuth 回调完成后，不直接把系统 JWT 放在 URL 上，而是生成一次性 `loginTicket`
- 前端通过 `ticket` 换取正式 JWT，降低 token 暴露风险
```

Rationale:
- 当前架构没有外部 IdP 概念，需要显式补充认证边界和回调安全策略

### Proposal C — UX 更新

Target: `_bmad-output/planning-artifacts/ux-design-specification.md`

Section: 登录体验 / 用户管理体验

OLD:

```md
首次使用：登录系统，看到导航结构
```

NEW:

```md
首次使用：登录系统时可选择“账号密码登录”或“钉钉扫码登录”

- 密码登录：保留现有用户名/密码表单
- 钉钉扫码登录：点击后跳转钉钉授权页，授权成功后自动回到系统并完成登录
- 未绑定钉钉账号时：展示明确提示“当前钉钉账号尚未绑定 ERP 用户，请联系管理员”
- 用户管理页：在列表和详情中展示钉钉绑定状态、绑定时间，并提供绑定/解绑入口
```

Rationale:
- 这是明确的新增用户旅程，不补 UX 会导致 story 缺少页面和交互标准

### Proposal D — Epic 变更

Target: `_bmad-output/planning-artifacts/epics.md`

OLD:

```md
### Epic 8: 发货需求状态自动流转
...
```

NEW:

```md
### Epic 9: 企业 SSO 与钉钉扫码登录
系统在保留现有用户名/密码登录的基础上，引入钉钉扫码登录能力。钉钉只作为外部身份认证提供方，后端完成授权回调、身份匹配与本地 JWT 签发；管理员可在用户管理中维护钉钉绑定关系，未绑定用户不得通过扫码直接进入系统。
**FRs covered:** FR-A04, FR-A05
**NFRs addressed:** NFR-S1, NFR-S3, NFR-S4, NFR-U2
**UX-DRs addressed:** UX-DR01, UX-DR15, UX-DR17, UX-DR20, UX-DR23
```

建议 story 拆分：

```md
9-2-后端钉钉OAuth回调与JWT签发
9-3-前端登录页与钉钉回调页
9-4-用户管理钉钉绑定能力
9-5-联调测试与上线校验
```

Rationale:
- 这是跨后端、前端、数据模型和配置的成组需求，独立 Epic 比补丁 story 更清晰

### Proposal E — Sprint Status 更新建议

Target: `_bmad-output/implementation-artifacts/sprint-status.yaml`

批准后新增：

```yaml
  epic-9: backlog
  9-2-后端钉钉OAuth回调与JWT签发: backlog
  9-3-前端登录页与钉钉回调页: backlog
  9-4-用户管理钉钉绑定能力: backlog
  9-5-联调测试与上线校验: backlog
  epic-9-retrospective: optional
```

Rationale:
- 当前所有 epic 已完成，新增需求应被显式纳入 backlog，而不是隐含执行

## 6. High-Level Action Plan

1. 批准本 proposal
2. 更新 `epics.md`，新增 Epic 9
3. 更新 `sprint-status.yaml`，新增 Epic 9 backlog 条目
4. 基于技术研究文档创建 `Epic 9` 的后续 story 集
5. 按顺序实施：
   - 用户表字段与 migration
   - 后端 OAuth 回调与 ticket 交换
   - 前端登录页与回调页
   - 用户管理绑定能力
   - 联调与测试

依赖：
- 钉钉应用已在开放平台创建
- 正式回调域名已确定
- 管理员预绑定策略被业务接受

## 7. Scope Classification and Handoff

范围：**Moderate**

推荐 handoff：
- `Product Owner / Developer`

职责建议：
- Product Owner：批准 Epic 9 与 story 拆分，确认是否允许自动开户
- Developer：依据技术研究与 proposal 创建 story，并进入实现

成功标准：
- 本地密码登录保持可用
- 钉钉扫码可完成成功登录
- 未绑定用户被阻止进入系统且提示清晰
- 用户管理可查看和维护钉钉绑定状态
- 全链路测试通过，正式回调地址可联调

## 8. Final Recommendation

建议批准本次变更，并将“钉钉扫码登录”作为 **Epic 9** 纳入 backlog，而不是回写到已完成的 Epic 1。

这是一次明确的新业务能力扩展，不会推翻现有架构方向；采用“钉钉认证 + 本地 JWT”能够在风险最小的前提下满足企业登录体验要求。

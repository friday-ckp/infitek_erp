# Story 9.7: ERP 用户匹配建议与冲突状态引擎

Status: done

## Story

As a 系统管理员,
I want 系统基于手机号、邮箱、工号为钉钉用户生成 ERP 用户匹配建议,
so that 我可以更快确认绑定，同时避免误绑。

## Acceptance Criteria

1. **唯一命中时生成候选建议**
   - 系统针对钉钉用户池中的待处理记录执行匹配建议逻辑
   - 按手机号、邮箱、工号的唯一命中顺序尝试匹配 ERP 用户
   - 唯一命中时该记录标记为 `CANDIDATE`

2. **冲突命中时保留依据**
   - 若某个钉钉用户命中多个 ERP 用户或字段相互冲突
   - 该记录标记为 `CONFLICT`
   - 系统保留匹配依据，供管理员判断

3. **未命中时保持待处理**
   - 若某个钉钉用户未命中任何 ERP 用户
   - 该记录保持 `UNBOUND`
   - 系统不得自动开户或自动生成 ERP 用户

4. **确认绑定时回写正式绑定结果**
   - 管理员确认候选绑定后
   - 系统把绑定结果回写到 `users` 表的钉钉字段
   - 钉钉用户池状态更新为 `BOUND`
   - 同一钉钉身份只能绑定一个 ERP 用户

## Tasks / Subtasks

### 匹配建议与状态流转

- [ ] 1. 实现钉钉用户池匹配建议逻辑（AC: 1, 2, 3）
  - [ ] 在 `apps/api/src/modules/dingtalk-org-users/` 中新增匹配建议入口，避免把候选逻辑塞进 `auth`
  - [ ] 按手机号、邮箱、工号的唯一命中顺序尝试匹配本地 ERP 用户
  - [ ] 仅在唯一命中时标记为 `CANDIDATE`
  - [ ] 在多命中或命中依据冲突时标记为 `CONFLICT`
  - [ ] 未命中时保持 `UNBOUND`

- [ ] 2. 保存匹配依据与建议结果（AC: 1, 2, 3）
  - [ ] 在钉钉用户池表或等价结构中记录 `suggestedUserId`
  - [ ] 记录 `matchReason` 或等价依据字段，避免管理员只能看到最终状态
  - [ ] 保持状态与匹配结果同步，不要让 `status` 与建议信息脱节

### 正式绑定与解绑处理

- [ ] 3. 实现候选确认绑定接口（AC: 4）
  - [ ] 提供管理员确认候选绑定的后端接口
  - [ ] 复用既有 `users` 表中的 `dingtalk_*` 字段作为正式绑定结果承载点
  - [ ] 绑定成功后将钉钉用户池状态更新为 `BOUND`
  - [ ] 若目标钉钉身份已被其他 ERP 用户占用，返回稳定业务错误码

- [ ] 4. 实现冲突/未绑定记录的手工绑定与解绑回流（AC: 2, 3, 4）
  - [ ] 支持管理员为 `CONFLICT` 或 `UNBOUND` 记录手动选择 ERP 用户并确认绑定
  - [ ] 支持解绑后把用户池状态回流到待处理态，而不是仅清空 `users` 表字段
  - [ ] 不自动开户、不自动绑定、不绕过人工确认

### 测试与验证

- [ ] 5. 补齐后端测试（AC: 1, 2, 3, 4）
  - [ ] 唯一命中生成 `CANDIDATE`
  - [ ] 多命中或冲突生成 `CONFLICT`
  - [ ] 未命中保持 `UNBOUND`
  - [ ] 管理员确认候选绑定后状态变更为 `BOUND`
  - [ ] 钉钉身份已占用时返回稳定错误

- [ ] 6. 运行最小必要验证（AC: 1, 2, 4）
  - [ ] `pnpm --filter api test -- --runInBand dingtalk-org-users`
  - [ ] `pnpm --filter api test -- --runInBand users`
  - [ ] `pnpm --filter api build`
  - [ ] `git diff --check`

## Dev Notes

### Story Boundary

- 本 Story 只负责“匹配建议、冲突状态和正式绑定确认”的后端规则层。
- 本 Story 不承担完整后台交互界面，那是 Story 9.8 的职责。
- 本 Story 不自动开户、不自动绑定、不把候选池直接并入扫码登录主链路。
- 本 Story 可以复用 Story 9.4 的正式绑定字段与手工绑定经验，但需要把状态回流补完整。

### Story Foundation And Cross-Story Context

- Story 9.6 已建立 `dingtalk_org_users` 独立用户池，并明确 `UNBOUND / CANDIDATE / CONFLICT / BOUND` 状态枚举。
- Story 9.6 已提供同步接口、用户池列表和管理员触发入口，但仍缺少正式的候选建议与冲突处理逻辑。
- Story 9.4 已交付对 `users` 表中 `dingtalk_*` 字段的手工绑定/解绑能力，可作为本 Story 的正式绑定结果承载基础。
- Story 9.2 的扫码登录主链继续只依赖 `users.dingtalk_union_id`，因此本 Story 不能让候选池数据直接影响登录放行。

### Current Code Context

- 钉钉用户池模块位于：
  - `apps/api/src/modules/dingtalk-org-users/`
- 现有正式绑定结果位于：
  - `apps/api/src/modules/users/entities/user.entity.ts`
  - `apps/api/src/modules/users/users.service.ts`
- 前端最小运营入口已放在：
  - `apps/web/src/pages/settings/users/index.tsx`
  - `apps/web/src/api/dingtalk-org-users.api.ts`
- 当前 `dingtalk_org_users` 已包含 `suggestedUserId` / `matchReason` 字段，但尚未形成完整的匹配建议与状态流转闭环。

### Architecture Compliance

- 当前真实 API 前缀是 `/api`，不是旧文档中的 `/api/v1`。[Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- 认证体系仍是统一 Access Token（8 小时、无 Refresh Token）；本 Story 不得引入旁路登录态。[Source: `_bmad-output/planning-artifacts/architecture.md#认证与安全`]
- 正式扫码登录仍只依赖 `users.dingtalk_union_id`；候选池只能作为后台运营数据。[Source: `_bmad-output/planning-artifacts/architecture.md#认证与安全`]
- 状态推进必须通过专用动作接口完成，不能让前端直接 PATCH 状态字段。[Source: `_bmad-output/project-context.md#Transaction & Domain Rules`]

### Matching Guidance

- 首期匹配建议顺序：
  - 手机号唯一命中
  - 邮箱唯一命中
  - 工号唯一命中
- 若多个字段分别命中不同 ERP 用户，应优先判定为 `CONFLICT`，而不是选择“更像”的用户。
- 即便唯一命中，也只允许标记为 `CANDIDATE`，必须管理员确认后才允许回写 `users` 表。
- 解绑后应同步更新钉钉用户池状态，避免池中记录仍显示 `BOUND`。

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 9.7`]
- [Source: `_bmad-output/planning-artifacts/prd.md#FR-A06-FR-A08`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#认证与安全`]
- [Source: `_bmad-output/project-context.md#Backend Framework Rules`]
- [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- [Source: `_bmad-output/implementation-artifacts/9-6-钉钉组织用户同步与用户池建模.md`]
- [Source: `_bmad-output/implementation-artifacts/9-4-用户管理钉钉绑定能力.md`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Completion Notes List

- 本 Story 文件为解除 story-automator 在 create-story 阶段的阻塞而补建，但内容完全依据现有规划与已实现代码约束生成。
- Story 9.7 明确把“候选建议逻辑”和“正式绑定回写”绑定在一起，同时保持“不自动绑定”的边界。
- Story 9.7 复用 9.6 已落地的数据模型，不重复发明新的外部身份主表。

### File List

- `_bmad-output/implementation-artifacts/9-7-ERP用户匹配建议与冲突状态引擎.md` (new)

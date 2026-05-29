# Story 9.2: 后端钉钉 OAuth 回调与 JWT 签发

Status: done

## Story

As a 企业员工,
I want 通过钉钉扫码完成身份认证并换取系统 JWT,
so that 我可以在不输入本地密码的情况下安全登录 ERP，同时复用现有权限与审计体系。

## Acceptance Criteria

1. **钉钉登录入口**
   - 后端提供钉钉登录入口，供前端点击“钉钉扫码登录”后使用
   - 入口要么直接 302 跳转到钉钉授权页，要么返回可跳转的授权地址
   - 授权请求必须包含用于防重放校验的 `state`

2. **OAuth 回调与身份匹配**
   - 钉钉回调 `GET /auth/dingtalk/callback?code=...&state=...` 时，后端完成 `state` 校验
   - 后端使用 `code` 换取钉钉身份信息
   - 后端基于 `dingtalk_union_id` 查找本地用户绑定关系

3. **成功登录后的 ticket 跳转**
   - 当钉钉身份已绑定本地启用用户时，后端不得把系统 JWT 直接放到 URL
   - 后端生成一次性 `loginTicket`
   - 后端 302 跳转到 `DINGTALK_FRONTEND_CALLBACK_URI?ticket=...`

4. **ticket 交换正式 JWT**
   - 前端持有有效 `loginTicket` 后，调用 `POST /auth/dingtalk/exchange`
   - 后端签发与密码登录一致的系统 JWT，默认有效期保持 8 小时
   - 响应遵循统一成功响应结构
   - `loginTicket` 只能成功使用一次

5. **失败场景与统一错误语义**
   - 未绑定钉钉账号时拒绝登录，并返回前端可识别的错误结果
   - 停用账号、无效 `state`、过期或重复使用的 ticket 都返回统一错误响应
   - 不暴露钉钉 access token、系统 JWT、内部堆栈或其他敏感信息

6. **配置与数据模型前提复用**
   - 复用 Story 9.1 已完成的 `users` 钉钉字段和唯一索引
   - 复用 `DINGTALK_CLIENT_ID`、`DINGTALK_CLIENT_SECRET`、`DINGTALK_REDIRECT_URI`、`DINGTALK_FRONTEND_CALLBACK_URI`
   - 不破坏现有本地密码登录、JWT 校验和用户管理行为

## Tasks / Subtasks

- [x] 1. 提供钉钉登录入口与 `state` 管理（AC: 1, 2, 5, 6）
  - [x] 在 `apps/api/src/modules/auth/auth.controller.ts` 新增 `@Public()` 的钉钉登录入口，推荐为 `GET /auth/dingtalk/login`
  - [x] 生成高熵 `state`，保存为短 TTL 的一次性记录，并在回调时严格校验存在性、时效性和单次消费语义
  - [x] 优先采用后端直接 302 跳转到钉钉授权页，避免前端自己拼接授权 URL
  - [x] 保持实现口径与当前仓库实际前缀一致：运行时 API 前缀是 `/api`，不是旧文档里的 `/api/v1`

- [x] 2. 实现 OAuth 回调、钉钉身份换取与本地用户匹配（AC: 2, 3, 5, 6）
  - [x] 在 `AuthController` 新增 `@Public()` 的 `GET /auth/dingtalk/callback`
  - [x] 在 `AuthService` 中封装 `code -> 钉钉身份信息 -> 本地用户` 的完整链路
  - [x] 在 `UsersRepository` / `UsersService` 新增按 `dingtalkUnionId` 查询的方法，并继续过滤软删除用户
  - [x] 当用户不存在绑定或账号停用时，返回稳定错误码并中断后续 JWT 签发
  - [x] 成功后生成一次性 `loginTicket`，302 到 `DINGTALK_FRONTEND_CALLBACK_URI?ticket=...`

- [x] 3. 实现一次性 `loginTicket` 交换正式 JWT（AC: 3, 4, 5）
  - [x] 新增 `POST /auth/dingtalk/exchange` 公开接口和 DTO，例如 `ExchangeDingtalkTicketDto`
  - [x] `loginTicket` 必须具备 TTL、单次消费和消费后失效语义
  - [x] JWT 签发路径必须复用现有 `JwtService` 与密码登录 payload 约定，避免出现第二套系统 token 语义
  - [x] 交换成功响应建议返回 `{ accessToken, user }`，其中 `user` 至少包含前端现有 `auth.store` 需要的 `username`、`name`

- [x] 4. 补齐钉钉客户端与配置读取实现（AC: 1, 2, 5, 6）
  - [x] 在 `apps/api/src/modules/auth/` 内增加钉钉认证客户端或 helper，封装授权地址生成、`code` 换身份、返回结果映射
  - [x] 优先使用 Node 18 原生 `fetch` 或当前已有能力，不为本 Story 引入新的 HTTP 客户端依赖
  - [x] 读取 Story 9.1 已注册的 `dingtalk` 配置命名空间，缺失配置时返回可定位但不泄密的错误
  - [x] 运行时唯一外部身份键固定为 `dingtalk_union_id`，不要改用 `dingtalk_user_id` 作为主匹配键

- [x] 5. 保持现有认证链路兼容并补齐自动化测试（AC: 4, 5, 6）
  - [x] 保证 `POST /auth/login` 原有用户名密码登录仍可使用，且测试继续通过
  - [x] 为 `AuthService` 增加成功登录、未绑定、停用账号、无效 state、ticket 过期/重复使用等单元测试
  - [x] 为 `AuthController` 增加登录入口、回调、ticket 交换接口的控制器测试
  - [x] 运行 `pnpm --filter api test -- --runInBand -- auth` 或等价定向测试、`pnpm --filter api build`、`git diff --check`

## Dev Notes

### Story Boundary

- 本 Story 只负责后端钉钉登录入口、OAuth 回调、用户匹配、一次性 ticket 和 JWT 签发。
- 本 Story 不实现登录页按钮、前端回调页 UI 或 `ticket -> JWT` 前端消费逻辑，这些属于 Story 9.3。
- 本 Story 不实现管理员绑定/解绑能力，也不引入自动开户；绑定维护属于 Story 9.4。
- 本 Story 不引入 refresh token、SSO 会话中心、独立身份表或 Redis 基础设施升级，除非实现被当前部署事实明确阻塞。
- 本 Story 预期不再新增数据库 migration；Story 9.1 已完成字段扩展与唯一索引准备，当前应直接复用。

### Story Foundation And Cross-Story Context

- Epic 9 的目标是在保留用户名密码登录的前提下，引入“钉钉只负责外部认证，本地系统仍签发自己 JWT”的企业 SSO 方案。
- Story 9.2 是 Epic 9 的后端主链路，直接为 Story 9.3 提供 `/auth/dingtalk/login`、`/auth/dingtalk/callback`、`/auth/dingtalk/exchange` 三个契约。
- Story 9.4 依赖本 Story固定的身份主键和错误语义，绑定管理必须继续复用 `dingtalk_union_id` 与现有用户字段，而不是另起模型。
- Story 9.5 会以本 Story 的接口行为为基线做联调和上线检查，因此错误码、ticket 语义和本地登录兼容性都必须稳定。

### Current Code Context

- `apps/api/src/modules/auth/auth.controller.ts` 当前只有 `POST /auth/login`，且通过 `@Public()` 放开访问。钉钉相关入口需要沿用相同公开路由机制。
- `apps/api/src/modules/auth/auth.service.ts` 当前只有 `login(username, password)`，JWT payload 仅包含 `{ sub, username }`。钉钉登录成功后必须复用这一 JWT 约定。
- `apps/api/src/modules/auth/auth.module.ts` 已接入 `JwtModule`、`PassportModule`、`ConfigModule` 和 `UsersModule`，适合继续在本模块内新增钉钉 helper / store / DTO。
- `apps/api/src/modules/users/entities/user.entity.ts` 已存在 Story 9.1 新增的钉钉字段和 `idx_users_dingtalk_union_id` 唯一索引，可直接承接匹配逻辑。
- `apps/api/src/modules/users/users.repository.ts` 当前只有 `findByUsername`、`findById`、`findAll` 等方法，没有按钉钉 union id 查询的方法。
- `apps/api/src/config/dingtalk.config.ts` 已注册 `dingtalk` 配置命名空间，供本 Story 直接读取；不要重新发明第二套环境变量读取方式。
- `apps/web/src/api/request.ts` 的 `baseURL` 是 `/api`，而且响应拦截器只返回 `response.data.data`；因此本 Story 的 JSON 接口必须返回统一 data 结构即可。
- `apps/web/src/store/auth.store.ts` 现有 `login(token, user)` 需要 `token` 和最少的 `user.username`、`user.name`，所以 `exchange` 成功返回建议包含这两个字段。

### Architecture Compliance

- 认证体系仍是单一 Access Token（8h，无 Refresh Token）；钉钉扫码登录和密码登录最终签发同一种系统 JWT。[Source: `_bmad-output/planning-artifacts/architecture.md#认证与安全`]
- `JwtAuthGuard` 是全局守卫，新增公开接口必须显式 `@Public()`，否则前端和钉钉回调无法访问。[Source: `_bmad-output/project-context.md#Backend Framework Rules`]
- 当前实际全局前缀由 `apps/api/src/main.ts` 的 `app.setGlobalPrefix('api')` 决定，因此实现应以 `/api/auth/...` 为准；旧架构文档中的 `/api/v1/` 口径不能覆盖当前代码事实。[Source: `apps/api/src/main.ts`]
- 正常 JSON 接口由 `ResponseInterceptor` 自动包装成功响应；异常由 `HttpExceptionFilter` 输出 `{ success, data, message, code }`。`exchange` 应遵循此结构，避免手工再包一层响应体。[Source: `apps/api/src/common/interceptors/response.interceptor.ts`, `apps/api/src/common/filters/http-exception.filter.ts`]
- OAuth callback 需要 302 跳转，不适合按普通 JSON 接口处理。当前仓库没有现成 `redirect` 模式，建议仅在 callback 上使用 `@Res()` 或等价机制做手动重定向，并保持其他接口继续走统一响应拦截器。
- 不得把系统 JWT 放到 callback URL；只能把一次性 `ticket` 带给前端完成二次交换。[Source: `_bmad-output/planning-artifacts/epics.md#Story 9.2`, `_bmad-output/planning-artifacts/architecture.md#认证与安全`]

### Recommended Implementation Shape

- 在 `apps/api/src/modules/auth/` 内新增轻量钉钉认证客户端，例如 `dingtalk-auth.client.ts` 或 `providers/dingtalk-auth.provider.ts`，负责：
  - 生成授权地址
  - 使用 `code` 交换钉钉身份
  - 将外部响应映射为内部最小身份对象 `{ unionId, userId, openId, nick, avatar }`
- 在 `apps/api/src/modules/auth/` 内新增一次性状态与 ticket 存储 helper，推荐作用域仅限 Auth 模块，避免为本 Story 引入全局 session 基建。
- 若当前部署仍为单实例，可接受先用进程内 `Map` + TTL 清理实现 `state` / `loginTicket`；若实现时发现部署为多实例，再升级为共享存储，但不要在本 Story 无依据地引入 Redis。
- `loginTicket` 推荐保存最小必要数据：`userId`、`username`、`issuedAt`、`expiresAt`、`usedAt|null`，避免把完整 JWT、钉钉 access token 或敏感原始响应落入 ticket store。
- ticket 交换成功后，响应建议为：
  - `accessToken`
  - `user: { id, username, name }`
  这样 Story 9.3 可以直接复用现有前端 `auth.store`，无需再多打一跳“获取当前用户”接口。

### Security Guardrails

- 不允许自动创建本地用户；未绑定钉钉账号必须被拒绝，并提示联系管理员。
- 不允许把钉钉 `code`、钉钉 access token、系统 JWT、`loginTicket` 写入自定义应用日志、异常信息或前端可见错误详情。
- 不允许仅依赖 `dingtalk_user_id` 做主匹配；稳定匹配键固定为 `dingtalk_union_id`。
- 不允许修改现有密码登录成功/失败语义；Story 9.2 必须是在现有 `POST /auth/login` 旁边新增链路，而不是重写原登录。
- 不允许无界缓存 `state` / `ticket`；必须有 TTL 和消费后清理策略，避免进程内泄漏。
- 由于 `LoggingInterceptor` 会记录请求 URL，实现时不要额外记录 callback 查询参数；如需全局日志脱敏，应作为额外 follow-up，而不是在本 Story 中悄悄扩大范围。

### Error Contract Guidance

- 推荐为前端和联调提供稳定业务码，例如：
  - `DINGTALK_STATE_INVALID`
  - `DINGTALK_ACCOUNT_UNBOUND`
  - `DINGTALK_ACCOUNT_DISABLED`
  - `DINGTALK_TICKET_INVALID`
  - `DINGTALK_TICKET_EXPIRED`
  - `DINGTALK_TICKET_USED`
  - `DINGTALK_OAUTH_FAILED`
- callback 失败时，推荐仍跳转到 `DINGTALK_FRONTEND_CALLBACK_URI`，并附带前端可识别的稳定错误参数，例如 `?error=DINGTALK_ACCOUNT_UNBOUND`；不要把原始异常栈或第三方返回全文拼到 URL。
- `POST /auth/dingtalk/exchange` 的失败必须走现有统一错误响应结构，供前端回调页直接展示清晰提示。

### Previous Story Intelligence

- Story 9.1 已经完成：
  - `users` 表钉钉字段扩展
  - `dingtalk_union_id` 唯一索引
  - `dingtalk.config.ts` 配置注册
  - `.env.example` 补齐
  - auth/users 相关测试补充
- Story 9.2 不应重复新增字段、改名或重做 migration；应把重点放在认证链路本身。
- Story 9.1 已明确“管理员预绑定，不自动开户”和“不要把 JWT 放在 URL 上”，本 Story 必须严格继承这两个安全边界。
- Story 9.1 还确认了未来 Story 9.4 直接复用同一组用户字段模型，因此本 Story 不要引入临时字段或平行绑定结构。

### Git Intelligence Summary

- 最近与 Epic 9 相关的提交是 `feat(story-9.1): 钉钉应用配置与用户模型扩展`，说明当前代码库已经接受“先模型与配置、后回调和 exchange”的分步落地方式。
- 现有 auth 测试目录是 `apps/api/src/modules/auth/tests/`，用户侧补充测试主要在 `apps/api/src/modules/users/__tests__/`；本 Story 应沿用该组织方式，不要新开风格完全不同的测试目录。
- 9.1 的实现把钉钉配置放在 `apps/api/src/config/`，因此 9.2 的钉钉外部调用 helper 更适合放在 `modules/auth/` 内，保持“配置在 config、业务接入在模块内”的边界。

### Technical Research Summary

- 钉钉接入模式推荐为“企业内部应用 + 网页应用能力 + 后端 OAuth 回调 + 本地 JWT 签发 + 管理员预绑定”。[Source: `_bmad-output/planning-artifacts/research/technical-dingtalk-sso-research-2026-05-29.md#1. 应用类型结论`]
- 推荐回调时序是：登录页点击 -> 钉钉授权 -> 后端 callback -> 后端生成一次性 `loginTicket` -> 前端 callback 页用 ticket 换 JWT。[Source: `_bmad-output/planning-artifacts/research/technical-dingtalk-sso-research-2026-05-29.md#2. 回调地址设计`]
- 运行时唯一主匹配字段应是 `dingtalk_union_id`，`dingtalk_user_id` / `dingtalk_open_id` / `dingtalk_nick` / `dingtalk_avatar` 作为辅助保留字段。[Source: `_bmad-output/planning-artifacts/research/technical-dingtalk-sso-research-2026-05-29.md#3. 用户匹配字段结论`]
- 当前推荐绑定策略是“管理员预绑定，扫码只做认证，不自动开户”。[Source: `_bmad-output/planning-artifacts/research/technical-dingtalk-sso-research-2026-05-29.md#4. 绑定策略结论`]

### File Targets

- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/dto/`
- `apps/api/src/modules/auth/tests/auth.controller.spec.ts`
- `apps/api/src/modules/auth/tests/auth.service.spec.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/users/users.repository.ts`
- 如需新增钉钉 helper / ticket store：`apps/api/src/modules/auth/` 内

### Testing Guidance

- 必测主链路：
  - 已绑定且启用用户通过 callback 成功获取 ticket，再通过 exchange 获取 JWT
  - 未绑定用户 callback 失败
  - 已停用用户 callback 失败
  - 无效 / 过期 / 重复使用 ticket 失败
  - 原有密码登录继续成功
- 推荐测试层次：
  - `auth.service.spec.ts`：state 校验、ticket 生成与消费、用户匹配、JWT 签发
  - `auth.controller.spec.ts`：公开路由、参数透传、错误透传、redirect 调用
  - 如新增独立钉钉 client / ticket store，可补 helper 级单测，避免把所有细节都塞进 service spec
- 推荐命令：
  - `pnpm --filter api test -- --runInBand auth`
  - `pnpm --filter api build`
  - `git diff --check`

### Project Structure Notes

- 当前仓库没有现成的 session / cache / redirect 组件，Story 9.2 应在 `modules/auth` 内做最小可用实现，而不是抽象出一整套平台级 SSO 框架。
- 用户查询扩展应通过 `UsersRepository` / `UsersService` 增加定向方法来完成，不要在 `AuthService` 中直接操作 TypeORM Repository。
- 仅 callback 需要特殊 302 行为；`login` 和 `exchange` 之外的其他认证逻辑继续沿用现有 controller/service/interceptor 结构即可。
- 如果实现时需要前端识别用户信息，优先让 `exchange` 直接返回最小 `user` 数据，而不是提前扩展“当前登录用户资料”新接口。

### Non-Blocking Questions Saved For Later

- AC 1 允许“返回授权地址或直接重定向”。基于当前登录流程，推荐直接 302；若实现团队更偏好前端控制跳转，可在不破坏 Story 9.3 的前提下改为返回 `authUrl`。
- 若部署拓扑已变为多实例，进程内 `state` / `loginTicket` store 可能不够，需要共享存储。当前 Story 默认以单实例部署为前提，是否升级可在开发启动前确认。

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 9.2`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story 9.3`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story 9.4`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story 9.5`]
- [Source: `_bmad-output/implementation-artifacts/9-1-钉钉应用配置与用户模型扩展.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#认证与安全`]
- [Source: `_bmad-output/project-context.md#Backend Framework Rules`]
- [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- [Source: `_bmad-output/planning-artifacts/research/technical-dingtalk-sso-research-2026-05-29.md`]
- [Source: `apps/api/src/main.ts`]
- [Source: `apps/api/src/modules/auth/auth.controller.ts`]
- [Source: `apps/api/src/modules/auth/auth.service.ts`]
- [Source: `apps/api/src/modules/auth/auth.module.ts`]
- [Source: `apps/api/src/modules/users/entities/user.entity.ts`]
- [Source: `apps/api/src/modules/users/users.repository.ts`]
- [Source: `apps/api/src/modules/users/users.service.ts`]
- [Source: `apps/api/src/common/decorators/public.decorator.ts`]
- [Source: `apps/api/src/common/guards/jwt-auth.guard.ts`]
- [Source: `apps/api/src/common/interceptors/response.interceptor.ts`]
- [Source: `apps/api/src/common/filters/http-exception.filter.ts`]
- [Source: `apps/web/src/api/request.ts`]
- [Source: `apps/web/src/store/auth.store.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Loaded BMAD create-story skill, workflow, input discovery protocol, template, and checklist.
- Loaded Epic 9 planning content, Story 9.1 output, architecture/auth sections, project-context, technical research, and current auth/users/web auth code.
- Implemented Dingtalk OAuth login entry, callback redirect flow, one-time state/ticket store, Dingtalk auth client, exchange DTO, and dingtalk union-id user lookup.
- Ran `pnpm --filter api test -- --runInBand auth`, `pnpm --filter api build`, `git diff --check`, and `pnpm --filter api exec jest --runInBand` for regression validation.

### Completion Notes List

- Story 9.2 context is grounded in the current repo reality: API 前缀 `/api`、JWT 全局守卫、现有 auth.store 契约、以及 Story 9.1 已完成的数据模型。
- 已显式记录 callback redirect 与统一 JSON 响应并存时的实现边界，避免开发阶段误用全局响应包装。
- 已补充前后故事依赖、错误码建议、ticket/state 存储约束和“不自动开户”安全边界。
- 已新增 `/auth/dingtalk/login`、`/auth/dingtalk/callback`、`/auth/dingtalk/exchange` 三个公开接口，callback 成功仅下发一次性 `ticket`，失败统一跳转前端并附带稳定错误码。
- 已通过 `UsersRepository` / `UsersService` 新增 `findByDingtalkUnionId`，继续过滤软删除用户，并复用现有 JWT payload `{ sub, username }`。
- 新增进程内一次性 `state` / `loginTicket` 存储，具备 TTL、单次消费与重复使用拦截语义；未引入新的 HTTP 客户端依赖。
- 定向验证通过：`pnpm --filter api test -- --runInBand auth`、`pnpm --filter api build`、`git diff --check`。
- 全量后端回归 `pnpm --filter api exec jest --runInBand` 仍存在仓库既有失败，集中在 `contract-templates.service.spec.ts`、`skus.service.spec.ts`、`product-categories.service.spec.ts`，与本 Story 改动无关。

### File List

- `_bmad-output/implementation-artifacts/9-2-后端钉钉OAuth回调与JWT签发.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/dingtalk-auth.client.ts`
- `apps/api/src/modules/auth/dingtalk-login-session.store.ts`
- `apps/api/src/modules/auth/dto/exchange-dingtalk-ticket.dto.ts`
- `apps/api/src/modules/auth/tests/auth.controller.spec.ts`
- `apps/api/src/modules/auth/tests/auth.service.spec.ts`
- `apps/api/src/modules/auth/tests/dingtalk-auth.client.spec.ts`
- `apps/api/src/modules/auth/tests/dingtalk-login-session.store.spec.ts`
- `apps/api/src/modules/users/users.repository.ts`
- `apps/api/src/modules/users/users.service.ts`

## Change Log

- 2026-05-29: Story 9.2 实现完成，新增钉钉 OAuth 登录入口、回调、一次性 ticket 交换、进程内 state/ticket store、union-id 用户匹配与自动化测试；定向 auth 测试和构建通过。
- 2026-05-29: Senior Developer Review (AI) — 修复 2 HIGH + 1 MEDIUM 问题，0 CRITICAL。状态更新为 done。

## Senior Developer Review (AI)

**Reviewer:** Friday on 2026-05-29
**Outcome:** Approve (after auto-fix)
**Issues Found:** 0 Critical, 2 High, 1 Medium, 0 Low
**Issues Fixed:** 3 (all HIGH + MEDIUM)

### Fixes Applied

1. **[HIGH] OAuth callback 的一次性 `state` 消费语义不完整** — 原实现遇到“有 `state` 但缺少 `code`”时直接返回错误跳转，没有消费 `state`，与 AC 2 要求的单次消费不一致，也留下 replay 窗口。现已调整为：只要 `state` 存在，就先校验并消费，再处理 `code` 缺失等后续失败路径。
2. **[HIGH] 公共钉钉登录入口/交换接口未实际启用限流守卫** — 代码只引入了 `@Throttle()` 装饰器，但模块或控制器内没有 `ThrottlerGuard`，导致 `/auth/dingtalk/login` 和 `/auth/dingtalk/exchange` 实际不受限流保护，易被刷请求堆积进程内 `state` / ticket。现已为公开认证端点显式启用 `ThrottlerGuard`。
3. **[MEDIUM] Story File List 与实际变更不一致** — 实际新增了 `apps/api/src/modules/auth/tests/dingtalk-auth.client.spec.ts`，但 Dev Agent Record → File List 未记录。现已补齐，避免后续审计遗漏。

### Validation Notes

- Acceptance Criteria 已按实现逐项复核，3 个公开接口与 ticket/state 单次语义、错误码、JWT 复用路径均已验证。
- 变更后重新执行 `pnpm --filter api test -- --runInBand auth`、`pnpm --filter api build`、`git diff --check`，均通过。
- 本次 review 按工作流要求排除了 `_bmad/`、`_bmad-output/` 之外的非源码配置目录，仅对 Story 文件本身做必要状态与记录同步。

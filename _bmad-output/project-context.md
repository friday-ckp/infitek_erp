---
project_name: infitek_erp
user_name: friday
date: 2026-05-27
sections_completed:
  [technology_stack, language_rules, framework_rules, backend_rules, frontend_rules, ux_rules, testing_rules, workflow_rules, anti_patterns]
status: complete
rule_count: 78
optimized_for_llm: true
---

# Project Context for AI Agents — infitek_erp

_AI Agent 实现代码前必须阅读。本文只记录容易被漏掉、会导致实现偏离项目的关键规则。_

---

## Technology Stack & Versions

| 层级 | 技术 | 当前版本/约束 |
|---|---|---|
| Monorepo | pnpm workspace | 根目录 `pnpm-workspace.yaml`；根脚本 `pnpm dev` / `pnpm build` |
| Node | Node.js | `apps/api/package.json` 要求 `>=18.0.0` |
| 后端框架 | NestJS | `@nestjs/*` 11.x |
| ORM / DB | TypeORM + MySQL | `typeorm` 0.3.28，`mysql2` 3.22，MySQL 8.x |
| API 文档 | Swagger | `@nestjs/swagger` 11.2，开发环境 `/api/docs` |
| 后端日志 | nestjs-pino / pino | 结构化日志，`LoggerModule` 全局注册 |
| 后端测试 | Jest + ts-jest | Jest 30，`apps/api` 内嵌 Jest 配置 |
| 后端 TypeScript | TypeScript | 5.7.3；`moduleResolution: nodenext` |
| 前端框架 | React | 19.2.4 |
| 前端构建 | Vite | 8.0.4 |
| 前端 UI | Ant Design / ProComponents | antd 5.24，`@ant-design/pro-components` 2.8 |
| 前端状态 | TanStack Query / Zustand | Query 5.74，Zustand 5.0 |
| 前端路由 | React Router | 7.6 |
| 前端测试 | Playwright | 1.59；配置在 `apps/web/playwright.config.ts` |
| 前端 TypeScript | TypeScript | web 使用 `~6.0.2`，shared 使用 `^6.0.3` |
| 共享包 | `@infitek/shared` | `workspace:*`，输出 CJS + ESM + types |

**版本口径以当前 `package.json` 和代码为准。旧架构文档中的 `/api/v1/`、Vite 6、pnpm 9 等历史口径不得覆盖当前实现。**

---

## Critical Implementation Rules

### Language-Specific Rules

- 后端 TS 配置启用 `strictNullChecks`、`isolatedModules`、decorator metadata；处理 nullable 字段时必须显式分支，不能假设 DB 字段永远存在。
- 后端允许 `any`，但 ESLint 会警告 `no-floating-promises` 和 unsafe argument；异步调用必须 `await`、`return` 或显式处理错误。
- 前端 TS 开启 `noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`，避免未使用变量、参数和不可擦除语法。
- 前端 `tsconfig.app.json` 使用 bundler resolution、`verbatimModuleSyntax`、`jsx: react-jsx`；保持 ESM import，不引入 CommonJS 写法。
- `@infitek/shared` 是前后端共享枚举/类型唯一来源；禁止在 `apps/api` 或 `apps/web` 中复制业务枚举。
- 共享枚举采用 `as const` 对象 + union type 模式，禁止新增 TypeScript `enum` 关键字。
- 金额、数量、ID 从 Entity/SQL 返回时经常是 string/number 混合；Service 层对参与计算和比较的值必须显式 `Number(...)`。
- 注释只解释业务约束、事务边界、幂等原因；不要添加“给变量赋值”这类无信息注释。

### Backend Framework Rules

- 后端模块按业务域组织在 `apps/api/src/modules/{domain}`；常规模块包含 `module/controller/service/repository/entities/dto/tests`。
- 主数据模块位于 `apps/api/src/modules/master-data/{domain}`；交易模块位于 `sales-orders`、`shipping-demands`、`purchase-orders`、`receipt-orders`、`logistics-orders`、`outbound-orders`、`inventory`。
- Controller 只做路由、DTO、当前用户注入和调用 Service；业务校验、事务、状态推进必须在 Service/领域动作中完成。
- Repository 封装 TypeORM 查询和分页，Service 不应散落复杂列表 SQL，除非是事务内必须由 `queryRunner.manager` 执行。
- 所有 Entity 必须继承 `apps/api/src/common/entities/base.entity.ts` 的 `BaseEntity`，包含 `id/createdAt/updatedAt/createdBy/updatedBy`。
- Entity 字段必须显式 `@Column({ name: 'snake_case' })` 并配 `@Expose()`；密码等敏感字段用 `@Exclude()`。
- 使用软删除的实体统一 `@DeleteDateColumn({ name: 'deleted_at' })`；查询必须过滤 `deletedAt: IsNull()` 或等价条件。
- 新增或调整表结构必须添加 TypeORM migration；生产环境禁止依赖 `synchronize: true`。
- `AppModule` 已全局注册 `JwtAuthGuard`、`ClassSerializerInterceptor`、`LoggingInterceptor`、`ResponseInterceptor`、`AuditInterceptor`、`HttpExceptionFilter`；不要在单个 Controller 重复包一层响应体。
- API 前缀是 `app.setGlobalPrefix('api')`，前端 axios `baseURL` 是 `/api`；新增接口路径按 `/api/...` 推导。
- Controller 直接返回业务数据，`ResponseInterceptor` 自动包装为 `{ success, data, message: 'OK', code: 'OK' }`。
- 业务异常用 Nest exception 抛对象 `{ code, message, ... }`；前端错误拦截器会读取 `error.response.data.message`。
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` 全局启用；DTO 必须用 class-validator 描述可接受字段。
- `JwtAuthGuard` 全局鉴权；公开接口只允许显式 `@Public()`，当前核心公开入口是 `/auth/login`。
- 当前用户统一用 `@CurrentUser()`；不要从 request body 接收操作者身份。
- 登录停用账号 Token 必须失效；JwtStrategy 每次验证查库检查用户状态。
- `main.ts` 启动时会运行 `dataSource.runMigrations()`；migration 必须可重复、可排序、无破坏性默认值风险。
- Swagger 只在非生产环境启用，路径是 `/api/docs`。

### Transaction & Domain Rules

- 状态变更必须通过专用动作端点或领域动作服务，例如确认、作废、收货、出库；禁止通过通用 `PATCH /:id` 直接写状态字段。
- 前端不得提交“目标状态”来驱动交易流；状态由后端根据动作、数量事实和状态机聚合推进。
- 库存写操作必须使用 TypeORM `QueryRunner` 事务，并对库存汇总/批次/相关单据行执行行锁或等价并发保护。
- 库存数量权威来源是 `inventory_summary`、`inventory_batch`、`shipping_demand_inventory_allocations`、`inventory_transactions`；单据明细上的数量字段只作展示缓存或聚合结果。
- 库存不足错误必须返回明确业务码和当前可用量，例如 `STOCK_INSUFFICIENT` + `{ available: N }`。
- 交易确认类动作必须有幂等键，当前 DTO 常用 `requestKey`，实体落 `sourceActionKey`；重复提交应返回已有单据，不得重复累计库存或流水。
- 单据编号生成存在唯一冲突重试逻辑，遵循当前 `MAX_*_CODE_RETRIES` + 退避模式，不要改成无界循环。
- 操作日志是交易动作验收项；创建、确认、自动锁定、物流跟踪、出库、状态联动都应写 OperationLog / ActivityTimeline 所需数据。
- 收货入库：采购订单行数量、库存批次、库存流水、收货数量缓存、采购订单状态和发货需求自动锁定必须在同一业务动作中保持一致。
- 发货出库：出库必须消费 `shipping_demand_inventory_allocations`，同步扣减实际量与锁定量，并回填物流单、发货需求、销售订单状态。
- 发货需求是履约数量权威枢纽；销售订单、采购订单、物流单、收货单、出库单都围绕发货需求聚合展示。
- 部分收货、部分发货、部分锁定不能简化成“有动作即完成”；状态推进必须基于剩余量、已锁定量、已出库量、已收货量聚合。
- 对 Epic 5-8 交易链相关开发，必须优先加载并服从：
  - `_bmad-output/planning-artifacts/flow-cross-document-trigger.md`
  - `_bmad-output/planning-artifacts/flow-state-machine.md`
  - `_bmad-output/planning-artifacts/flow-quantity-data-lineage.md`
- 若 PRD、Architecture、UX、旧 Epic 文本、Story Dev Notes 与三份 flow 文档冲突，以三份 flow 文档和当前已实现代码为准。
- Epic 6-8 已完成主链：销售订单 -> 发货需求 -> 采购订单 -> 收货入库 -> 自动锁定 -> 物流单 -> 发货出库 -> 状态回填。后续更改不得破坏这条链。

### Frontend Framework Rules

- 前端 API 调用全部放在 `apps/web/src/api/*.api.ts`，统一使用 `apps/web/src/api/request.ts`；组件内禁止直接 `axios`。
- `request.ts` 已自动注入 `Authorization: Bearer <token>`，401 会清 token 并跳转 `/login`；页面不要重复实现鉴权跳转。
- `request.ts` 响应拦截器返回 `response.data.data`，因此 API 层函数的返回类型应是业务 data，不是完整响应体。
- 服务端数据用 TanStack Query 的 `useQuery/useMutation`；禁止用 `useEffect + useState` 手写请求生命周期。
- 全局 UI 状态用 Zustand，当前 store 在 `apps/web/src/store`；表单状态交给 antd/ProForm，不要复制到全局 store。
- 页面文件延续 `index.tsx`（列表）、`detail.tsx`（详情）、`form.tsx`（表单）模式；交易模块和主数据模块都按该模式组织。
- 主数据共享页面构件在 `apps/web/src/pages/master-data/components/page-scaffold.tsx`；新增主数据详情/表单优先复用 `MetaItem`、`SummaryMetaItem`、`SectionCard`、`OperationTimeline` 等模式。
- 通用搜索表单位于 `apps/web/src/components/common/SearchForm.tsx`；不要为每个列表重新发明筛选布局。
- 业务组件优先放在 `apps/web/src/components` 或相关模块共享目录；避免在页面文件里堆大段可复用组件。
- React Router 7 用当前项目路由组织；新增页面必须检查 `App.tsx` 和侧边栏配置，保证入口、面包屑、详情/编辑返回路径一致。
- 静态 antd message/notification 通过 `apps/web/src/utils/antdStatic.ts`；在 React 上下文外触发提示时必须使用该桥接。
- 日期展示使用 dayjs，并保持 `zh-cn` 语义；不要混用多个日期库。

### Frontend UX Rules

- 系统是企业 ERP 操作台，界面应信息密集、安静、可扫描；不要做营销式 hero、装饰卡片或大面积插画。
- 列表页必须包含标题/操作区、快捷搜索、高级筛选、筛选 Tag、固定表头数据表、右侧固定操作列、分页总数。
- 详情页采用“面包屑 + 摘要区 + 分组内容/Tab + 操作记录”的工作台布局；状态必须用 pill/tag，不得纯文字。
- 表单页采用独立编辑页；中复杂模块保留分组/Tab，底部固定取消和保存按钮。
- 状态色彩全系统统一：草稿/待处理灰，进行中/已确认蓝，警告/待处理橙，完成绿，作废/异常红。
- 每页最多一个 Primary 按钮；次要操作用灰框，表格行操作用 text，危险不可逆操作用 danger。
- 状态推进用 `Popconfirm`；删除/作废等不可逆操作用 `Modal` + 明确确认。禁止弹窗嵌套。
- 成功轻提示 `message.success`，重要成功 `notification.success`；失败 `message.error`，重要失败 `notification.error` 并允许手动关闭。
- 加载态区分首次加载 Skeleton、表格 Spin、按钮 loading；不要让用户在交易动作中看到无反馈点击。
- 空状态区分无数据和筛选无结果；筛选无结果要提供清除筛选入口。
- 高频操作不能藏进下拉菜单；下拉只放低频、次要、非阻塞操作。
- 不要硬编码散乱颜色；优先使用 antd status、项目 CSS 变量或既有样式类。

### Testing Rules

- 后端测试主要放在 `apps/api/src/modules/{domain}/tests/` 或既有 `__tests__/`；命名沿用 `{domain}.service.spec.ts`、`{domain}.repository.spec.ts`。
- Service 测试覆盖业务校验、状态变更、事务边界、幂等重复提交、异常码；Repository 测试覆盖查询条件和分页。
- 库存、收货、出库、状态联动必须有定向测试；涉及并发/幂等时至少覆盖重复请求不重复写库存/流水。
- Jest 配置把 `@infitek/shared` 映射到 `apps/api/src/__mocks__/infitek-shared`；新增共享枚举后需要同步测试 mock。
- 全量 API Jest 存在历史失败债；提交交易链变更时至少运行并记录相关定向测试和 build，不要把历史失败伪装成本次引入。
- 前端 E2E 使用 Playwright，脚本在 `apps/web`；关键主链应覆盖销售订单、发货需求、采购、收货、物流、出库和最终状态展示。
- 前端改 UI 后必须至少做本地页面检查；涉及响应式/复杂表格时补 Playwright 或手工截图验证。

### Code Quality & Style Rules

- 后端 ESLint 使用 `typescript-eslint` typed config + Prettier；格式化按 `apps/api/package.json` 的 `pnpm format`。
- 后端文件名使用 kebab-case，类名使用 PascalCase，DTO 文件用 `create-*.dto.ts`、`update-*.dto.ts`、`query-*.dto.ts`。
- TypeORM column name 使用 snake_case，TS 属性使用 camelCase；不要把 DB snake_case 泄漏到前端 DTO，除非已有接口契约如此。
- 分页请求统一 `page` + `pageSize`，默认 page=1、pageSize=20；分页响应统一 `{ data, total, page, pageSize, totalPages }`。
- 查询 DTO 负责 transform/validation，Repository 负责 where/order/pagination，Service 负责业务语义。
- 新增错误码必须稳定、英文大写下划线，并可被前端用于精确提示。
- 共享包变更后先 `pnpm --filter @infitek/shared build`；api/web 的 dev/build 脚本已有 prebuild/predev，但独立测试时要手动注意。
- 不要把 generated/dist 文件提交为源代码变更，除非任务明确要求发布构建产物。

### Development Workflow Rules

- 本仓库使用 BMAD 工作流；`start story {epic-story}` 时读取 `workflow/story-dev-workflow-single-repo.md`。
- Story 状态源是 `_bmad-output/implementation-artifacts/sprint-status.yaml`；Story 完成后必须同步状态。
- Epic 5-8 相关 Story 的 Dev Notes 必须明确记录三份 flow 文档已加载并作为冲突裁决依据。
- 分支命名优先 `story/{epic}-{story}-{slug}`；Codex 创建一般工作分支时使用 `codex/` 前缀，按用户或工作流要求优先。
- Commit 使用 Conventional Commits：`feat(scope): subject`、`fix(scope): subject` 等。
- 并行开发必须使用 git worktree 隔离，避免多个 agent 改同一工作树。
- 当前工作树可能有用户/其他 agent 的未提交改动；不要 revert、reset 或覆盖无关文件。
- 端到端交易链变更完成后，应更新相关 implementation artifact、测试记录和必要的复盘/状态文档。

### Critical Don't-Miss Rules

- 禁止把旧架构文档中的 `/api/v1/` 当成当前事实；当前实际前后端 API 前缀是 `/api`。
- 禁止在前后端重复定义状态、类型或枚举；必须从 `@infitek/shared` 引入。
- 禁止 Controller/组件直接修改交易状态；状态只能由后端领域动作和数量事实推进。
- 禁止库存写操作不加事务、不加行锁、不写库存流水。
- 禁止忽略 `sourceActionKey/requestKey` 幂等；确认类动作重复提交必须安全。
- 禁止用“存在下游单据”替代数量聚合判断完成状态。
- 禁止出库只改物流单状态而不消费 allocation、不扣库存、不回填发货需求和销售订单。
- 禁止收货只生成收货单而不增加库存批次/流水、不回填采购订单和发货需求。
- 禁止直接把 Entity 返回给前端前添加敏感字段；依赖 `ClassSerializerInterceptor` 和 `@Exclude()` 保护敏感属性。
- 禁止生产环境 `synchronize: true`；所有 schema 变化必须 migration 化。
- 禁止组件内直接 `axios`，禁止绕过 `request.ts` 的 token/401/错误处理。
- 禁止手写原生表格替代既有 antd/ProComponents/项目表格模式，除非已有模块已这样实现且任务要求延续。
- 禁止弹窗嵌套、每页多个 Primary、高频操作藏在更多菜单、纯文字状态。
- 禁止把全量测试历史失败归因到本次修改；必须区分既有债和新增回归。

---

## Usage Guidelines

**For AI Agents**

- 写代码前先读本文，再读对应 Story、flow 文档、当前模块代码和测试。
- 当文档冲突时，优先级为：当前代码事实 > 三份 flow 文档 > 最新 Story/复盘 > 旧 PRD/Architecture。
- 对交易链、库存、状态机、幂等、审计相关代码，选择更保守的实现。
- 新规则只有在代码或流程已经形成稳定事实后再加入本文，保持文档短而硬。

**For Humans**

- 技术栈升级、API 契约改变、状态机改变、交易链新增动作后更新本文。
- 定期删除已经显而易见或不再适用的规则。
- 后续建议补独立文档：交易单据“状态 × 动作 × 可编辑字段矩阵”和交易动作幂等键规范。

Last Updated: 2026-05-27

---
project_name: infitek_erp
user_name: friday
date: 2026-04-17
sections_completed: [technology_stack, backend_rules, frontend_rules, ux_rules, testing_rules, workflow_rules, anti_patterns]
---

# Project Context for AI Agents — infitek_erp

_AI Agent 实现代码时必须遵守的关键规则和模式。重点记录容易遗漏的非显而易见细节。_

---

## Technology Stack & Versions

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | NestJS | 11.x |
| ORM | TypeORM + @nestjs/typeorm | 0.3.x / 11.0.x |
| 数据库 | MySQL | 8.x |
| 认证 | JWT + Passport（@nestjs/jwt 11, @nestjs/passport 11） | — |
| 密码加密 | bcrypt | rounds=12 |
| 前端框架 | React | 19.x |
| 构建工具 | Vite | 8.x |
| UI 组件库 | Ant Design | 5.x |
| Pro 组件 | @ant-design/pro-components | 2.8.x |
| 服务端状态 | TanStack Query | 5.x |
| 全局状态 | Zustand | 5.x |
| 路由 | React Router | 7.x |
| HTTP 客户端 | Axios | 1.x |
| 包管理 | pnpm Workspace | — |
| 共享类型 | packages/shared（@infitek/shared） | workspace:* |

---

## 后端实现规则

### 模块结构（7 文件标准）

每个业务模块必须包含：`module / controller / service / repository / entity / dto / tests`

```
src/modules/{domain}/
├── {domain}.module.ts
├── {domain}.controller.ts
├── {domain}.service.ts
├── {domain}.repository.ts
├── entities/{domain}.entity.ts
├── dto/create-{domain}.dto.ts
├── dto/update-{domain}.dto.ts
└── tests/{domain}.service.spec.ts
```

### Entity 规则

- 所有 Entity **必须继承 `BaseEntity`**（含 id/createdAt/updatedAt/createdBy/updatedBy）
- 每个字段必须同时加 `@Expose()` 和 `@Column({ name: 'snake_case' })` 显式指定列名
- 密码等敏感字段用 `@Exclude()` 而非 `@Expose()`
- 软删除统一用 `@DeleteDateColumn({ name: 'deleted_at' })`
- 查询时必须过滤软删除：`where: { deletedAt: IsNull() }`

```typescript
// 正确示例
@Column({ name: 'username', type: 'varchar', length: 50 })
@Expose()
username: string;

@Column({ name: 'password', type: 'varchar', length: 255 })
@Exclude()
password: string;
```

### 枚举规则

- **所有枚举必须定义在 `packages/shared`**，禁止前后端独立定义
- 枚举用 `as const` 对象模式（非 TypeScript enum 关键字）

```typescript
// packages/shared/src/enums/xxx.enum.ts
export const XxxStatus = { ACTIVE: 'active', INACTIVE: 'inactive' } as const;
export type XxxStatus = typeof XxxStatus[keyof typeof XxxStatus];
```

### API 响应格式

统一响应体（通过全局 ResponseInterceptor 自动包装，Controller 直接 return 数据即可）：

```json
{ "success": true, "data": {}, "message": "OK", "code": "OK" }
{ "success": false, "data": null, "message": "错误原因", "code": "BUSINESS_ERROR_CODE" }
```

- API 前缀：`/api`（main.ts 已配置 `setGlobalPrefix('api')`）
- 分页参数：`page`（默认 1）+ `pageSize`（默认 20），Offset 分页
- 分页响应：`{ data: [], total: N, page: N, pageSize: N, totalPages: N }`

### 认证规则

- `JwtAuthGuard` 已全局注册，所有接口自动鉴权，无需逐 Controller 添加
- 豁免接口用 `@Public()` 装饰器（仅 `/auth/login`）
- 获取当前用户用 `@CurrentUser()` 装饰器（`apps/api/src/common/decorators/current-user.decorator.ts`）
- 停用账号后 Token 立即失效：JwtStrategy 每次验证时查库检查 `status`

### 库存并发规则（关键）

- 所有库存写操作（锁定/解锁/扣减/增加）**必须使用 TypeORM QueryRunner 事务 + `SELECT ... FOR UPDATE`**
- `available_quantity` 由 Service 层在事务内维护，不做数据库计算列
- 库存不足错误必须携带当前可用量：`STOCK_INSUFFICIENT` + `{ available: N }`
- 死锁重试：指数退避最多 3 次，超限抛 `ConflictException({ code: 'CONCURRENT_UPDATE' })`

### 状态机规则

- 状态变更必须通过专用动作端点：`POST /:id/confirm`、`POST /:id/cancel` 等
- **禁止**通过通用 `PATCH /:id` 直接修改状态字段

### 数据库迁移

- 生产环境禁止 `synchronize: true`
- 每个新 Entity 必须创建对应 TypeORM Migration 文件

---

## 前端实现规则

### 页面结构（3 文件标准）

每个业务模块前端包含：`index.tsx`（列表页）/ `detail.tsx`（详情页）/ `form.tsx`（表单页）

```
src/pages/{module}/
├── index.tsx    ← 列表页（ProTable）
├── detail.tsx   ← 详情页（ProDescriptions）
└── form.tsx     ← 表单页（ProForm）
```

### API 调用规则

- **禁止**在组件内直接调用 axios
- 所有 API 调用必须通过 `src/api/` 层函数
- axios 实例在 `src/api/client.ts` 统一配置（Token 注入、401 跳转）
- 服务端状态用 TanStack Query（`useQuery` / `useMutation`），禁止手写 `useEffect` 请求

### 组件选型规则

| 场景 | 必用组件 |
|------|---------|
| 列表页 | `ProTable`（@ant-design/pro-components） |
| 表单页 | `ProForm` + `ProFormItem` 系列 |
| 详情页 | `ProDescriptions` |
| 全局布局 | `ProLayout` |
| 关联实体选择 | `EntitySearchSelect`（自定义，`components/business/`） |

**禁止**用原生 HTML table、手写 `<input>`、手写分页逻辑替代上述 Pro 组件。

### 状态管理规则

- 服务端数据（接口数据）：TanStack Query
- 全局 UI 状态（当前用户、侧边栏折叠）：Zustand
- 表单状态：ProForm 内部管理，禁止用 useState 手写表单状态

---

## 前端 UX 规范（必须遵守）

### Design Token（全局主题）

```typescript
// antd ConfigProvider theme
token: {
  colorPrimary: '#4C6FFF',
  colorPrimaryHover: '#3D5CE0',
  borderRadius: 10,
  colorBgContainer: '#FFFFFF',
  colorBgLayout: '#F5F7FA',
}
```

侧边导航背景色：`#1B2A4A`（深蓝，非 antd 默认）

### 列表页标准（UX-DR04）

必须包含以下所有元素：
1. 页面标题 + 右侧操作按钮（Primary 蓝色实心，每页最多 1 个）
2. 快捷搜索框（debounce 300ms）+ 可折叠高级筛选区
3. 已选筛选条件 Tag 化展示（可单独删除 + "清除全部"）
4. 固定表头数据表格（行高 48px，首列单据编号蓝色链接，状态列彩色 Tag，操作列固定右侧）
5. 底部分页器（10/20/50 可切换）+ "共 N 条记录"

### 详情页标准（UX-DR05）— 已升级

> 完整规范见 `_bmad-output/planning-artifacts/ux-std-detail-edit-page.md`
> 原型参考 `_bmad-output/prototypes/sku-detail-edit-prototype.html`

1. Topbar 面包屑导航（`模块名 › 列表名 › 记录标识`）
2. 摘要卡片（Summary Card）：编码 + 状态 pill + 3-5 个核心摘要字段 + 操作按钮组
3. Tab 分组内容区（info-card + tabs-bar + tab-body）
4. 数据展示使用三列 `meta-grid` 网格（替代原两列 ProDescriptions）
5. 子表数据使用 `data-table` 展示
6. 只读关联 Tab 附 `info-tip` 说明数据来源
7. 所有状态字段使用 pill/tag 样式，禁止纯文字

### 表单页标准（UX-DR06）— 已升级

> 完整规范见 `_bmad-output/planning-artifacts/ux-std-detail-edit-page.md`

- 整页编辑模式：独立编辑页（`/:id/edit`），保留 Tab 分组，去掉只读关联 Tab
- 表单默认两列布局（`form-row`），三级联动用三列（`form-row col3`），长文本占满整行（`form-row full`）
- 条件显示字段使用 `cond-block` 虚线边框样式
- 子表使用可编辑表格（`editable-table`），支持增删行
- 底部固定"取消 + 保存"按钮
- 简单模块（<10 字段）：无需 Tab，单卡片即可
- 中等模块（10-30 字段）：2-3 个 Tab
- 复杂模块（>30 字段）：4-6 个 Tab

### 状态色彩映射（全系统统一，UX-DR07）

| 状态 | antd status | 色彩 |
|------|-------------|------|
| 草稿 / 待处理 | `default` | 灰色 |
| 已确认 / 进行中 | `processing` | 蓝色 |
| 警告 / 待处理 | `warning` | 橙色 |
| 已完成 / 已收货 | `success` | 绿色 |
| 已作废 / 异常 | `error` | 红色 |

状态必须**色彩 + 文字双重编码**，禁止纯文字状态。

### 按钮层级（UX-DR15）

- Primary 蓝色实心：每页最多 1 个
- Secondary 白底灰框：次要操作
- Text 蓝色无框：表格行操作
- Danger 红色：不可逆操作（最左侧）
- Dashed 虚线：添加类操作

### 反馈机制（UX-DR17）

- 轻量成功：`message.success` 3 秒
- 重要成功：`notification.success` 5 秒（含关联单据链接）
- 失败：`message.error` 5 秒
- 重要失败：`notification.error` 手动关闭
- 表单校验：内联红色提示（ProForm 自动处理）

### 二次确认规则（UX-DR16）

- 创建/保存：无需确认
- 状态推进：`Popconfirm` 气泡
- 不可逆操作（删除/作废）：`Modal` + 输入确认

### 加载状态（UX-DR21）

- 首次加载：Skeleton 骨架屏
- 表格加载：Spin 遮罩
- 按钮操作中：loading 旋转 + 禁用

### 空状态（UX-DR22）

- 无数据（无筛选）：空插图 + "暂无数据" + 新建按钮
- 无数据（有筛选）：空插图 + "未找到匹配记录" + "清除筛选条件"链接

### 弹窗规则（UX-DR24）

- 严禁弹窗嵌套（弹窗中不能再弹弹窗）
- Modal 最大宽度 720px，Drawer 最大宽度 520px
- ESC 可关闭（危险操作除外）

### 自定义业务组件（放在 `components/business/`）

| 组件 | 用途 |
|------|------|
| `FlowProgress` | 发货需求 7 步流程进度条 |
| `SmartButton` | 关联单据计数器（采购订单 N \| 物流单 N） |
| `InventoryIndicator` | SKU 库存状态 Pill（绿/橙/红） |
| `PurchaseGroupPreview` | 采购分组预览 Drawer（520px） |
| `StatCard` | KPI 统计卡片 |
| `ActivityTimeline` | 操作记录时间线 |
| `EntitySearchSelect` | 关联实体搜索选择器 |

---

## 测试规则

- 后端测试分层：单元测试（Service）+ 集成测试（Controller）+ 并发测试（仅库存模块）
- 测试文件放在 `src/modules/{domain}/tests/` 或 `src/modules/{domain}/__tests__/`
- 测试文件命名：`{domain}.service.spec.ts`
- 前端 MVP 阶段：关键表单组件渲染快照测试（Vitest + Testing Library）
- E2E 测试：Playwright（`apps/web/e2e/`）

---

## 开发工作流规则

- 分支命名：`story/{epic}-{story}-{slug}`（如 `story/2-1-crud-template`）
- Commit 格式：Conventional Commits（`feat(scope): subject`）
- 每个 Story 完成后更新 `_bmad-output/implementation-artifacts/sprint-status.yaml`
- 并行开发必须使用 git worktree 隔离（`../worktrees/<BRANCH>`）

---

## 禁止事项（Anti-Patterns）

### 后端

- ❌ 禁止在 Entity 中省略 `@Column({ name })` 显式列名
- ❌ 禁止在 Entity 中省略 `@Expose()` / `@Exclude()`
- ❌ 禁止在前后端各自定义枚举（必须在 packages/shared）
- ❌ 禁止通过 PATCH 修改状态字段（必须用专用动作端点）
- ❌ 禁止库存写操作不加事务和行锁
- ❌ 禁止生产环境 `synchronize: true`

### 前端

- ❌ 禁止在组件内直接调用 axios（必须通过 api/ 层）
- ❌ 禁止用原生 HTML table 替代 ProTable
- ❌ 禁止用手写 useState 管理服务端数据（必须用 TanStack Query）
- ❌ 禁止弹窗嵌套（超过一层改用页面跳转）
- ❌ 禁止纯文字状态（必须用彩色 Tag）
- ❌ 禁止硬编码颜色值（必须用 Design Token 或 antd status 语义色）
- ❌ 禁止每页超过 1 个 Primary 按钮
- ❌ 禁止把高频操作藏在下拉菜单里

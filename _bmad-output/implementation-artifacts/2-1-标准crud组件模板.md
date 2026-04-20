# Story 2.1: 标准 CRUD 组件模板（前后端）

Status: ready-for-dev

## Story

As a 开发者,
I want 一套可复用的标准 CRUD 组件模板（后端模块脚手架 + 前端列表/详情/表单三态页面模板）,
So that 后续 15 类主数据和交易单据模块可以快速复用，保证全系统交互一致性。

---

## Acceptance Criteria

**Given** 后端需要新建一个主数据模块
**When** 以"单位管理"为载体创建模块
**Then** 模块包含完整的 7 文件结构：module / controller / service / repository / entity / dto / tests
**And** Entity 继承 BaseEntity，字段使用 `@Expose()` 和 `@Column({ name })` 显式指定列名
**And** Controller 暴露标准 CRUD 端点：`GET /`（列表）、`GET :id`（详情）、`POST /`（创建）、`PATCH /:id`（编辑）
**And** QueryDto 支持 `keyword`、`page`、`pageSize` 参数
**And** TypeORM Migration 创建对应数据库表

**Given** 前端需要新建一个主数据页面
**When** 以"单位管理"为载体创建页面
**Then** 列表页（index.tsx）使用 ProTable，包含：快捷搜索框（debounce 300ms）+ 可折叠高级筛选区 + 已选筛选条件 Tag 化展示（可单独删除 + "清除全部"）+ 固定表头数据表格（行高 48px，首列蓝色链接，操作列固定右侧）+ 底部分页器（10/20/50 可切换 + "共 N 条记录"）
**And** 详情页（detail.tsx）使用 ProDescriptions 分组卡片展示
**And** 表单页（form.tsx）使用 ProForm 分组布局，必填字段红色星号

**Given** 列表页无数据
**When** 未设置任何筛选条件
**Then** 显示空状态插图 + "暂无数据" + "新建单位"按钮（满足 UX-DR22）

**Given** 列表页无数据
**When** 已设置筛选条件
**Then** 显示空状态插图 + "未找到匹配记录" + "清除筛选条件"链接（满足 UX-DR22）

**Given** 页面正在加载数据
**When** 首次进入页面
**Then** 显示 Skeleton 骨架屏；表格区域显示 Spin 遮罩（满足 UX-DR21）

**Given** 表格展示数据
**When** 查看列内容
**Then** 数字列右对齐使用 tabular-nums，日期格式 YYYY-MM-DD，超长文本截断 + Tooltip 展示全文（满足 UX-DR25）

---

## Tasks / Subtasks

### 后端实现

- [ ] 创建 UnitModule 7 文件结构
  - [ ] `apps/api/src/modules/master-data/units/units.module.ts`
  - [ ] `apps/api/src/modules/master-data/units/units.controller.ts`
  - [ ] `apps/api/src/modules/master-data/units/units.service.ts`
  - [ ] `apps/api/src/modules/master-data/units/units.repository.ts`
  - [ ] `apps/api/src/modules/master-data/units/entities/unit.entity.ts`
  - [ ] `apps/api/src/modules/master-data/units/dto/create-unit.dto.ts`
  - [ ] `apps/api/src/modules/master-data/units/dto/update-unit.dto.ts`
  - [ ] `apps/api/src/modules/master-data/units/dto/query-unit.dto.ts`
  - [ ] `apps/api/src/modules/master-data/units/tests/units.service.spec.ts`

- [ ] 创建 Unit Entity（继承 BaseEntity，含软删除）

- [ ] 创建 QueryDto 基类（keyword + page + pageSize）
  - [ ] 放在 `apps/api/src/common/dto/base-query.dto.ts`（供后续所有模块复用）

- [ ] 实现 UnitsService（CRUD + 分页查询）

- [ ] 实现 UnitsController（4 个标准端点）

- [ ] 创建 TypeORM Migration 文件（`units` 表）

- [ ] 在 AppModule 注册 UnitsModule

- [ ] 编写 Service 单元测试

### 前端实现

- [ ] 创建 units 页面目录 `apps/web/src/pages/master-data/units/`
  - [ ] `index.tsx`（列表页，使用 ProTable）
  - [ ] `detail.tsx`（详情页，使用 ProDescriptions）
  - [ ] `form.tsx`（表单页，使用 ProForm）

- [ ] 创建 API 层 `apps/web/src/api/units.api.ts`

- [ ] 在路由配置中注册 units 路由

- [ ] 在侧边导航中添加"单位管理"入口

---

## Dev Agent Context

### 关键约束（必须遵守）

#### 后端约束

1. **模块路径**：`apps/api/src/modules/master-data/units/`（master-data 子目录，与架构文档一致）
2. **Entity 必须继承 BaseEntity**：`import { BaseEntity } from '../../../common/entities/base.entity'`
3. **每个字段必须同时加 `@Expose()` 和 `@Column({ name: 'snake_case' })`**
4. **软删除**：`@DeleteDateColumn({ name: 'deleted_at' })`，查询时过滤 `where: { deletedAt: IsNull() }`
5. **API 前缀**：全局已配置 `setGlobalPrefix('api')`，Controller 路径写 `units` 即可（最终为 `/api/units`）
6. **响应格式**：全局 ResponseInterceptor 自动包装，Controller 直接 return 数据
7. **认证**：JwtAuthGuard 已全局注册，无需在 Controller 添加
8. **枚举**：如需状态枚举，必须定义在 `packages/shared/src/enums/`，使用 `as const` 模式
9. **Migration**：生产环境禁止 `synchronize: true`，必须创建 Migration 文件

#### 前端约束

1. **列表页必须使用 ProTable**（`@ant-design/pro-components`），禁止用原生 `<Table>`
2. **详情页必须使用 ProDescriptions**
3. **表单页必须使用 ProForm + ProFormItem 系列**
4. **禁止在组件内直接调用 axios**，必须通过 `src/api/` 层函数
5. **服务端状态用 TanStack Query**（`useQuery` / `useMutation`），禁止手写 `useEffect` 请求
6. **禁止硬编码颜色值**，使用 Design Token 或 antd status 语义色
7. **每页最多 1 个 Primary 按钮**

### 现有代码参考

#### 参考 Entity 模式（`apps/api/src/modules/users/entities/user.entity.ts`）

```typescript
import { Entity, Column, Index, DeleteDateColumn } from 'typeorm';
import { Expose, Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('units')
export class Unit extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Expose()
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 50 })
  @Expose()
  code: string;

  @Column({ name: 'status', type: 'enum', enum: UnitStatus, default: UnitStatus.ACTIVE })
  @Expose()
  status: UnitStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

#### 参考 Repository 模式（`apps/api/src/modules/users/users.repository.ts`）

```typescript
@Injectable()
export class UnitsRepository {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  async findAll(query: QueryUnitDto) {
    const { keyword, page = 1, pageSize = 20 } = query;
    const qb = this.repo.createQueryBuilder('unit')
      .where({ deletedAt: IsNull() });

    if (keyword) {
      qb.andWhere('(unit.name LIKE :kw OR unit.code LIKE :kw)', { kw: `%${keyword}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
```

#### 现有前端页面问题（重要！）

`apps/web/src/pages/settings/users/index.tsx` 使用了原生 `<Table>` 而非 `ProTable`，且直接调用 axios 而非 TanStack Query。**Story 2-1 必须纠正这些模式**，使用正确的 ProTable + TanStack Query 实现。

### 前端实现规范

#### 列表页（index.tsx）— 必须满足 UX-DR04

```typescript
// 必须包含的所有元素：
// 1. 页面标题 + 右侧"新建单位"Primary 按钮（每页最多 1 个）
// 2. 快捷搜索框（debounce 300ms）+ 可折叠高级筛选区
// 3. 已选筛选条件 Tag 化展示（可单独删除 + "清除全部"）
// 4. ProTable（行高 48px，首列名称蓝色链接，状态列彩色 Tag，操作列固定右侧）
// 5. 底部分页器（10/20/50 可切换）+ "共 N 条记录"

import { ProTable } from '@ant-design/pro-components';
import { useQuery, useMutation } from '@tanstack/react-query';
```

#### 空状态处理（UX-DR22）

```typescript
// 无数据（无筛选）
locale={{
  emptyText: (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/units/create')}>
        新建单位
      </Button>
    </Empty>
  )
}}

// 无数据（有筛选）— 通过判断是否有筛选条件动态切换
```

#### 加载状态（UX-DR21）

- 首次加载：ProTable 内置 loading 属性自动显示 Spin 遮罩
- 骨架屏：可在 ProTable 外层包裹 Skeleton，`loading={isLoading && !data}`

#### 状态色彩映射（UX-DR07）

```typescript
const statusTagMap = {
  active: { status: 'success' as const, text: '启用' },
  inactive: { status: 'default' as const, text: '禁用' },
};
// 使用 <Badge status={...} text={...} /> 或 <Tag color={...}>
// 禁止纯文字状态，必须色彩 + 文字双重编码
```

#### 详情页（detail.tsx）— 必须满足 UX-DR05

```typescript
// 结构：
// 1. 顶部操作区（面包屑 + 按钮组）
// 2. 状态信息栏（名称 + 状态 Tag）
// 3. ProDescriptions 分组卡片（两列布局）
// 4. 操作记录（可选，MVP 阶段可省略）

import { ProDescriptions } from '@ant-design/pro-components';
```

#### 表单页（form.tsx）— 必须满足 UX-DR06

```typescript
// 单位管理字段少（<10），使用单卡片 2 列布局
// 必填字段红色星号（ProForm 自动处理 rules: [{ required: true }]）

import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
```

### 关键文件路径（实际代码中已存在）

| 文件 | 路径 | 说明 |
|------|------|------|
| API 客户端 | `apps/web/src/api/request.ts` | axios 实例，默认导出 `request`，baseURL 已配置为 `/api` |
| 路由注册 | `apps/web/src/App.tsx` | 所有路由在此文件的 `<Routes>` 中注册 |
| 侧边导航 | `apps/web/src/components/layout/Sidebar.tsx` | "基础数据"分组（key: `master-data`）已存在，需在 `children` 中添加单位管理 |
| 共享枚举 | `packages/shared/src/enums/` | 已有 `user-status.enum.ts` 等，新增 `unit-status.enum.ts` |
| 共享类型 | `packages/shared/src/index.ts` | 新枚举需在此导出 |

**注意**：`apps/web/src/api/request.ts` 的响应拦截器已自动提取 `response.data.data`，API 函数直接返回业务数据，无需手动解包。

---

## 代码审查发现（2026-04-19）

### 需要决策的问题

- [ ] [Review][Decision] 缺少 DELETE 端点 — Story 2-1 要求标准 CRUD（GET/POST/PATCH/DELETE），但当前实现缺少 DELETE 操作。是否需要补充？

### 需要修复的问题

- [ ] [Review][Patch] API 响应格式不一致 [apps/web/src/api/units.api.ts:26] — 前端 `UnitsListData` 期望 `list` 字段，但后端 `UnitsRepository.findAll()` 返回 `data` 字段，导致前端无法正确解析数据
- [ ] [Review][Patch] 类型不匹配：Unit.id [apps/web/src/api/units.api.ts:5] — 前端定义 `id: string`，但后端返回 `number` 类型，会导致类型检查失败
- [ ] [Review][Patch] QueryUnitDto 缺少 status 过滤字段 [apps/api/src/modules/master-data/units/dto/query-unit.dto.ts] — 前端列表页支持 status 筛选，但 DTO 中没有 `status` 字段，导致筛选功能无效
- [ ] [Review][Patch] 前端 API 调用缺少错误处理 [apps/web/src/api/units.api.ts] — `getUnits()` 等函数没有 try-catch，错误会直接抛出导致应用崩溃
- [ ] [Review][Patch] Migration 缺少 down() 方法 [apps/api/src/migrations/20260419000100-create-units-table.ts] — 只有 `up()` 没有 `down()`，无法回滚迁移
- [ ] [Review][Patch] Entity 缺少 @Unique() 装饰器 [apps/api/src/modules/master-data/units/entities/unit.entity.ts] — 虽然 Migration 创建了唯一索引，但 Entity 应该用 `@Unique()` 装饰器声明
- [ ] [Review][Patch] 前端表单页缺少字段验证 [apps/web/src/pages/master-data/units/form.tsx] — 需要添加必填、长度限制等验证规则
- [ ] [Review][Patch] 前端列表页缺少错误状态处理 [apps/web/src/pages/master-data/units/index.tsx:65] — useQuery 的错误状态未处理，API 错误会导致页面空白
- [ ] [Review][Patch] 前端列表页分页状态未重置 [apps/web/src/pages/master-data/units/index.tsx:50] — 当 keyword 或 status 变化时，应重置 page 为 1，否则用户会看到空结果

### 已推迟的问题

- [x] [Review][Defer] 缺少 API 文档注释 [apps/api/src/modules/master-data/units/units.controller.ts] — deferred, 整个项目缺少 Swagger 装饰器，非此 PR 引入

### API 层规范

```typescript
// apps/web/src/api/units.api.ts
import request from './request';  // 注意：是 request，不是 client

export interface Unit {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UnitListResponse {
  data: Unit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// request 拦截器已自动提取 response.data.data，直接返回业务数据
export const unitsApi = {
  list: (params: { keyword?: string; page?: number; pageSize?: number }) =>
    request.get<any, UnitListResponse>('/units', { params }),
  get: (id: number) => request.get<any, Unit>(`/units/${id}`),
  create: (data: { name: string; code: string }) =>
    request.post<any, Unit>('/units', data),
  update: (id: number, data: Partial<{ name: string; code: string }>) =>
    request.patch<any, Unit>(`/units/${id}`, data),
};
```

### QueryDto 基类（供后续所有模块复用）

```typescript
// apps/api/src/common/dto/base-query.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseQueryDto {
  @IsOptional()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
```

### 路由注册（`apps/web/src/App.tsx`）

在 `<Route element={<AppLayout />}>` 内添加：

```typescript
// 在 App.tsx 顶部 import：
import UnitsList from './pages/master-data/units/index';
import UnitDetail from './pages/master-data/units/detail';
import UnitForm from './pages/master-data/units/form';

// 在 <Route element={<AppLayout />}> 内添加：
<Route path="/master-data/units" element={<UnitsList />} />
<Route path="/master-data/units/create" element={<UnitForm />} />
<Route path="/master-data/units/:id" element={<UnitDetail />} />
<Route path="/master-data/units/:id/edit" element={<UnitForm />} />
```

### 侧边导航（`apps/web/src/components/layout/Sidebar.tsx`）

"基础数据"分组（key: `master-data`）已存在，在其 `children` 数组中添加：

```typescript
{ key: '/master-data/units', label: '单位管理' },
// 添加在现有 children 的最前面（单位是最基础的参考数据）
```

### UnitStatus 枚举（`packages/shared/src/enums/unit-status.enum.ts`）

```typescript
// 注意：现有 user-status.enum.ts 使用 TypeScript enum 关键字
// 为保持一致性，也使用 enum 关键字（而非 as const）
export enum UnitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

在 `packages/shared/src/index.ts` 中添加导出：
```typescript
export * from './enums/unit-status.enum';
```

### 数据库表结构

```sql
-- Migration 文件需创建以下表
CREATE TABLE `units` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '单位名称',
  `code` varchar(50) NOT NULL COMMENT '单位代码',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_units_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Epic 1 回顾经验（必须应用）

1. **Dev Notes 文档质量**：实现完成后必须在 story 文件末尾补充 Dev Notes，记录架构约束、文件结构、关键代码模式
2. **Story 文件状态同步**：code review 通过后必须将 story 文件 `Status:` 更新为 `done`
3. **UX 规范强制执行**：所有前端实现必须对照 `ux-design-specification.md` 执行，组件选型不得偏离
4. **现有 users 页面偏差**：users 列表页使用了原生 Table 而非 ProTable，Story 2-1 必须使用正确的 ProTable 模式，作为后续所有模块的标准参考

---

## 分支命名

`story/2-1-crud-template`

---

## 完成标准

- [ ] 后端：`/api/units` 的 GET（列表+分页）、GET/:id（详情）、POST（创建）、PATCH/:id（编辑）均可正常调用
- [ ] 后端：Migration 文件已创建，`units` 表结构正确
- [ ] 后端：Service 单元测试通过
- [ ] 前端：列表页使用 ProTable，满足 UX-DR04 所有要素（搜索、筛选 Tag、分页、空状态、加载状态）
- [ ] 前端：详情页使用 ProDescriptions，满足 UX-DR05
- [ ] 前端：表单页使用 ProForm，满足 UX-DR06（必填星号、分组卡片）
- [ ] 前端：状态使用彩色 Tag（色彩 + 文字双重编码），满足 UX-DR07
- [ ] 前端：所有 API 调用通过 `src/api/` 层 + TanStack Query
- [ ] 路由和导航已注册

---

*Story 由 BMad PM Agent 创建 — 2026-04-19*

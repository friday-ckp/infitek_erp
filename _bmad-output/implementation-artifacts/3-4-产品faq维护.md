# Story 3.4: 产品 FAQ 维护

Status: review

## Story

As a 产品专员,
I want 为产品创建和维护 FAQ 条目（问题 + 回答）,
So that 销售员和客户咨询时可以快速查到标准答案，减少重复沟通。

---

## Acceptance Criteria

**Given** 产品专员在 SPU 详情页
**When** 查看 FAQ 标签页
**Then** 展示该 SPU 关联的所有 FAQ 列表（问题标题 + 操作列）
**And** 支持"新增 FAQ"按钮

**Given** 产品专员点击"新增 FAQ"
**When** 填写问题（必填）和回答（必填，多行文本）
**Then** FAQ 条目创建成功，关联当前 SPU
**And** 列表实时刷新展示新条目

**Given** 产品专员点击某条 FAQ 的"编辑"
**When** 修改回答内容并保存
**Then** FAQ 条目更新成功

**Given** 产品专员点击某条 FAQ 的"删除"
**When** 系统弹出 Popconfirm 确认（UX-DR16）
**Then** 确认后 FAQ 条目删除

**Given** 后端 FAQ 实体
**When** 查看设计
**Then** 包含 id、spu_id（外键）、question、answer、sort_order、created_at、updated_at、created_by、updated_by

---

## Tasks / Subtasks

### 后端：spu-faqs 模块

- [x] 创建 Entity `apps/api/src/modules/master-data/spu-faqs/entities/spu-faq.entity.ts`
- [x] 创建 DTO：`create-spu-faq.dto.ts`、`update-spu-faq.dto.ts`、`query-spu-faq.dto.ts`
- [x] 创建 Repository `spu-faqs.repository.ts`（含 findBySpu、findById、create、update、delete）
- [x] 创建 Service `spu-faqs.service.ts`（含 CRUD、spuId 校验）
- [x] 创建 Controller `spu-faqs.controller.ts`（4 个端点）
- [x] 创建 Module `spu-faqs.module.ts`（import SpusModule，export SpuFaqsService）
- [x] 创建 Migration `20260422000200-create-spu-faqs-table.ts`
- [x] 注册 SpuFaqsModule 到 `apps/api/src/app.module.ts`
- [x] 创建 Service 单元测试 `tests/spu-faqs.service.spec.ts`

### 前端：SPU 详情页 + FAQ 标签页

- [x] 创建 API 层 `apps/web/src/api/spu-faqs.api.ts`
- [x] 创建 FAQ Tab 组件 `apps/web/src/pages/master-data/spus/components/SpuFaqTab.tsx`
- [x] 修改 `apps/web/src/pages/master-data/spus/detail.tsx`：现有内容重构为 Tabs 布局

---

## Dev Agent Context

### 本 Story 核心范围

本 Story **不是**独立的列表/详情/表单页，而是：
1. 后端新增 `spu-faqs` 模块（完整 7 文件标准）
2. 前端将 SPU 详情页改造为 Tabs 布局，新增 FAQ 标签页
3. FAQ 的增删改通过 Modal 弹窗完成（不跳转页面）

---

### 后端实现规范

#### Entity

```typescript
// apps/api/src/modules/master-data/spu-faqs/entities/spu-faq.entity.ts
import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('spu_faqs')
@Index('idx_spu_faqs_spu_id', ['spuId'])
export class SpuFaq extends BaseEntity {
  @Column({ name: 'spu_id', type: 'bigint', unsigned: true })
  @Expose()
  spuId: number;

  @Column({ name: 'question', type: 'varchar', length: 500 })
  @Expose()
  question: string;

  @Column({ name: 'answer', type: 'text' })
  @Expose()
  answer: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @Expose()
  sortOrder: number;
}
```

#### Migration

文件名：`20260422000200-create-spu-faqs-table.ts`（参考 `20260421000100-create-spus-table.ts` 写法）

```typescript
// 列清单：
// id(bigint unsigned PK autoincrement)
// spu_id(bigint unsigned, not null)
// question(varchar 500, not null)
// answer(text, not null)
// sort_order(int, not null, default 0)
// created_at(datetime default CURRENT_TIMESTAMP)
// updated_at(datetime default CURRENT_TIMESTAMP onUpdate CURRENT_TIMESTAMP)
// created_by(varchar 100, nullable)
// updated_by(varchar 100, nullable)
//
// 索引：
// idx_spu_faqs_spu_id(spu_id)
```

#### Repository

```typescript
// apps/api/src/modules/master-data/spu-faqs/spu-faqs.repository.ts

async findBySpu(spuId: number): Promise<SpuFaq[]> {
  return this.repo.find({
    where: { spuId },
    order: { sortOrder: 'ASC', createdAt: 'ASC' },
  });
}

async findById(id: number): Promise<SpuFaq | null> {
  return this.repo.findOne({ where: { id } });
}

async create(data: Partial<SpuFaq>): Promise<SpuFaq> {
  return this.repo.save(this.repo.create(data));
}

async update(id: number, data: Partial<SpuFaq>): Promise<SpuFaq> {
  await this.repo.update(id, data);
  return this.findById(id) as Promise<SpuFaq>;
}

async delete(id: number): Promise<void> {
  await this.repo.delete(id);
}
```

#### Service

```typescript
// apps/api/src/modules/master-data/spu-faqs/spu-faqs.service.ts
// 注入：SpuFaqsRepository + SpusService

async findBySpu(spuId: number): Promise<SpuFaq[]> {
  // 可选：校验 SPU 存在（若要严格校验则注入 SpusService）
  return this.repo.findBySpu(spuId);
}

async create(dto: CreateSpuFaqDto, operator?: string): Promise<SpuFaq> {
  // 校验 SPU 存在
  const spu = await this.spusService.findById(dto.spuId);
  if (!spu) throw new NotFoundException('SPU 不存在');

  return this.repo.create({
    spuId: dto.spuId,
    question: dto.question,
    answer: dto.answer,
    sortOrder: dto.sortOrder ?? 0,
    createdBy: operator,
    updatedBy: operator,
  });
}

async update(id: number, dto: UpdateSpuFaqDto, operator?: string): Promise<SpuFaq> {
  const faq = await this.repo.findById(id);
  if (!faq) throw new NotFoundException('FAQ 不存在');
  return this.repo.update(id, { ...dto, updatedBy: operator });
}

async delete(id: number): Promise<void> {
  const faq = await this.repo.findById(id);
  if (!faq) throw new NotFoundException('FAQ 不存在');
  await this.repo.delete(id);
}
```

#### Controller 端点

```typescript
@Controller('spu-faqs')
export class SpuFaqsController {
  @Get()               // GET /api/spu-faqs?spuId=X → 按 SPU 获取 FAQ 列表（不分页）
  findBySpu(@Query('spuId', ParseIntPipe) spuId: number)

  @Post()              // POST /api/spu-faqs → 创建
  create(@Body() dto: CreateSpuFaqDto, @CurrentUser() user)

  @Patch(':id')        // PATCH /api/spu-faqs/:id → 更新
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpuFaqDto, @CurrentUser() user)

  @Delete(':id')       // DELETE /api/spu-faqs/:id → 删除（204）
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number)
}
```

#### DTO 设计

```typescript
// create-spu-faq.dto.ts
class CreateSpuFaqDto {
  @IsInt() @IsPositive() spuId: number;
  @IsString() @IsNotEmpty() @MaxLength(500) question: string;
  @IsString() @IsNotEmpty() answer: string;
  @IsInt() @Min(0) @IsOptional() sortOrder?: number;
}

// update-spu-faq.dto.ts — 手动声明所有可选字段（项目无 @nestjs/mapped-types）
class UpdateSpuFaqDto {
  @IsString() @IsOptional() @MaxLength(500) question?: string;
  @IsString() @IsOptional() answer?: string;
  @IsInt() @Min(0) @IsOptional() sortOrder?: number;
}

// query-spu-faq.dto.ts
class QuerySpuFaqDto {
  @Type(() => Number) @IsInt() @IsPositive() spuId: number; // 必填
}
```

**注意**：`UpdateSpuFaqDto` 手动声明可选字段，与其他模块（如 `update-spu.dto.ts`）保持一致。项目未安装 `@nestjs/mapped-types`，禁止使用 `PartialType`。

#### Module

```typescript
// apps/api/src/modules/master-data/spu-faqs/spu-faqs.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([SpuFaq]),
    SpusModule, // 需要 SpusService 校验 SPU 存在
  ],
  controllers: [SpuFaqsController],
  providers: [SpuFaqsRepository, SpuFaqsService],
  exports: [SpuFaqsService],
})
export class SpuFaqsModule {}
```

**注意**：`SpusModule` 已在 `spus.module.ts` 中 `exports: [SpusService]`，可直接 import。

#### 注册到 AppModule

```typescript
// apps/api/src/app.module.ts
import { SpuFaqsModule } from './modules/master-data/spu-faqs/spu-faqs.module';
// 在 imports 数组中添加 SpuFaqsModule（放在 SpusModule 之后）
```

---

### 前端实现规范

#### API 层

```typescript
// apps/web/src/api/spu-faqs.api.ts
// 参考 spus.api.ts 结构

export interface SpuFaq {
  id: number;
  spuId: number;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateSpuFaqPayload {
  spuId: number;
  question: string;
  answer: string;
  sortOrder?: number;
}

export interface UpdateSpuFaqPayload {
  question?: string;
  answer?: string;
  sortOrder?: number;
}

export async function getSpuFaqs(spuId: number): Promise<SpuFaq[]> {
  const res = await request.get('/spu-faqs', { params: { spuId } });
  return res.data.data;
}

export async function createSpuFaq(payload: CreateSpuFaqPayload): Promise<SpuFaq> {
  const res = await request.post('/spu-faqs', payload);
  return res.data.data;
}

export async function updateSpuFaq(id: number, payload: UpdateSpuFaqPayload): Promise<SpuFaq> {
  const res = await request.patch(`/spu-faqs/${id}`, payload);
  return res.data.data;
}

export async function deleteSpuFaq(id: number): Promise<void> {
  await request.delete(`/spu-faqs/${id}`);
}
```

#### FAQ Tab 组件（新建文件）

```typescript
// apps/web/src/pages/master-data/spus/components/SpuFaqTab.tsx
// 功能：FAQ 列表 + 新增/编辑 Modal + 删除 Popconfirm

import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSpuFaq, deleteSpuFaq, getSpuFaqs, updateSpuFaq, type SpuFaq,
} from '../../../../api/spu-faqs.api';

interface Props {
  spuId: number;
}

// 状态：
// - modalOpen: boolean
// - editingFaq: SpuFaq | null（null = 新增模式，非 null = 编辑模式）
// - form: Form.useForm()
//
// useQuery queryKey: ['spu-faqs', spuId]
// useMutation: createMutation, updateMutation, deleteMutation
//
// Table 列：
// - 序号（index + 1）
// - 问题（question）—— 限显示 1 行，超出省略
// - 回答（answer）—— 限显示 2 行，超出省略
// - 操作（编辑 Text 蓝色 + 删除 Popconfirm）
//
// 新增/编辑 Modal（宽度 600px）：
// - Form.Item: 问题（Input, 必填, maxLength 500, showCount）
// - Form.Item: 回答（TextArea, 必填, rows=6, autoSize={{ minRows: 4, maxRows: 10 }}）
// - Footer: 取消 + 保存（loading 状态）
//
// 删除 Popconfirm：
// - title="确认删除这条 FAQ 吗？"
// - okText="删除" okButtonProps={{ danger: true }}
// - cancelText="取消"
```

**完整实现要点**：
1. 查询 key 为 `['spu-faqs', spuId]`，mutation 成功后 `invalidateQueries({ queryKey: ['spu-faqs', spuId] })`
2. 编辑时 `form.setFieldsValue({ question: faq.question, answer: faq.answer })`，关闭 Modal 时 `form.resetFields()`
3. 成功提示：`message.success('保存成功')` / `message.success('已删除')`（3秒）
4. 失败提示：`message.error('操作失败，请稍后重试')` / `message.error(e.message)` 5秒
5. 按钮样式：
   - "新增 FAQ"：`type="dashed"`（添加类操作，UX-DR15）
   - 编辑：`type="link"`（表格行操作，UX-DR15）
   - 删除触发器：`type="link"` + `danger`

#### SPU 详情页改造（修改现有文件）

```typescript
// apps/web/src/pages/master-data/spus/detail.tsx
// 改造：在现有 ProDescriptions 分组基础上，外套 antd Tabs 组件

// 新增 import：
import { Tabs } from 'antd';
import SpuFaqTab from './components/SpuFaqTab';

// 布局改造：
// 原来：直接渲染 4 个 ProDescriptions + Empty 占位
// 改后：使用 Tabs，两个标签页：

<Tabs
  defaultActiveKey="info"
  items={[
    {
      key: 'info',
      label: '基本信息',
      children: (
        <>
          {/* 4 个 ProDescriptions 保持不变 */}
        </>
      ),
    },
    {
      key: 'faq',
      label: 'FAQ',
      children: <SpuFaqTab spuId={spuId} />,
    },
    {
      key: 'sku',
      label: 'SKU 变体',
      children: (
        <div style={{ padding: '24px', background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
          <Empty description="SKU 变体将在后续版本实现" />
        </div>
      ),
    },
  ]}
/>
```

**注意**：SKU 空占位 `<Empty>` 从现有的独立 div 移入 "SKU 变体" 标签页。

---

### 关键文件路径

| 文件 | 路径 | 操作 |
|------|------|------|
| Entity | `apps/api/src/modules/master-data/spu-faqs/entities/spu-faq.entity.ts` | 新建 |
| CreateDto | `apps/api/src/modules/master-data/spu-faqs/dto/create-spu-faq.dto.ts` | 新建 |
| UpdateDto | `apps/api/src/modules/master-data/spu-faqs/dto/update-spu-faq.dto.ts` | 新建 |
| QueryDto | `apps/api/src/modules/master-data/spu-faqs/dto/query-spu-faq.dto.ts` | 新建 |
| Repository | `apps/api/src/modules/master-data/spu-faqs/spu-faqs.repository.ts` | 新建 |
| Service | `apps/api/src/modules/master-data/spu-faqs/spu-faqs.service.ts` | 新建 |
| Controller | `apps/api/src/modules/master-data/spu-faqs/spu-faqs.controller.ts` | 新建 |
| Module | `apps/api/src/modules/master-data/spu-faqs/spu-faqs.module.ts` | 新建 |
| Migration | `apps/api/src/migrations/20260422000200-create-spu-faqs-table.ts` | 新建 |
| Service Spec | `apps/api/src/modules/master-data/spu-faqs/tests/spu-faqs.service.spec.ts` | 新建 |
| AppModule | `apps/api/src/app.module.ts` | 修改（添加 SpuFaqsModule） |
| API 层 | `apps/web/src/api/spu-faqs.api.ts` | 新建 |
| FAQ Tab 组件 | `apps/web/src/pages/master-data/spus/components/SpuFaqTab.tsx` | 新建 |
| SPU 详情页 | `apps/web/src/pages/master-data/spus/detail.tsx` | 修改（改造为 Tabs 布局） |

---

### 已存在、直接复用的基础设施

| 基础设施 | 路径 | 使用方式 |
|---------|------|---------|
| BaseEntity | `apps/api/src/common/entities/base.entity.ts` | Entity 继承 |
| CurrentUser 装饰器 | `apps/api/src/common/decorators/current-user.decorator.ts` | Controller 注入 |
| SpusService | `apps/api/src/modules/master-data/spus/spus.service.ts` | Service 校验 SPU 存在 |
| SpusModule（已 exports） | `spus.module.ts` | SpuFaqsModule import |
| request（axios） | `apps/web/src/api/request.ts` | API 层 import |
| TanStack Query | 已安装 | useQuery / useMutation |
| antd Tabs | 已安装 antd 5.x | SPU 详情页 Tabs |

---

### 测试要求

```
测试文件：apps/api/src/modules/master-data/spu-faqs/tests/spu-faqs.service.spec.ts
参考：apps/api/src/modules/master-data/spus/tests/spus.service.spec.ts

it('创建 FAQ 成功，关联 SPU')
it('创建 FAQ 时 SPU 不存在 → NotFoundException')
it('更新 FAQ 成功')
it('更新不存在的 FAQ → NotFoundException')
it('删除 FAQ 成功')
it('删除不存在的 FAQ → NotFoundException')
it('按 spuId 查询返回排序列表（sortOrder ASC, createdAt ASC）')
```

---

### 历史 Story 关键经验

来自 **Story 3.2（SPU）** 的经验：
- `updateMutation` 类型需区分 `CreatePayload` 与 `UpdatePayload`，本 Story 已在 API 层分开定义
- `useDebouncedValue` 从 `hooks/useDebounce.ts` 导入，本 Story 无搜索功能无需使用
- 工具函数提取到 `utils/` 目录；本 Story 无共享工具函数，无需处理

来自 **Story 2.3（companies）** 的经验：
- `App.tsx` 手动路由注册，本 Story **不新增路由**（FAQ 嵌入 SPU 详情页）
- TanStack Query 服务端数据禁止用 `useState` 替代

来自 **project-context.md** 的关键规则：
- `UpdateSpuFaqDto` 手动声明所有可选字段（项目无 `@nestjs/mapped-types`）
- 枚举必须定义在 `packages/shared`（本 Story 无需新增枚举）
- 删除用 Popconfirm（非 Modal），因为 FAQ 是相对低风险操作，且 Epics 明确指定 UX-DR16 Popconfirm

---

### 禁止事项（Anti-Patterns）

- **禁止** 为 FAQ 创建独立的 `index.tsx` 列表页（FAQ 嵌入 SPU 详情页的 Tab 中）
- **禁止** 在 App.tsx 添加 FAQ 相关路由
- **禁止** 在 Controller 中直接访问 Repository（必须通过 Service）
- **禁止** 在 Entity 中省略 `@Column({ name: 'snake_case' })` 和 `@Expose()`
- **禁止** 在前端组件内直接调用 axios（必须通过 `spu-faqs.api.ts`）
- **禁止** 使用 `useState` 管理服务端数据（必须用 TanStack Query）
- **禁止** 使用 `PartialType(CreateSpuFaqDto)` 在 `UpdateSpuFaqDto`（项目未安装 mapped-types）
- **禁止** FAQ 表单使用 `ProForm`（FAQ 表单在 Modal 内，使用 antd 原生 `Form` 即可；ProForm 在独立页面使用）
- **禁止** 将 FAQ Tab 改为内联行编辑（使用 Modal，符合已有弹窗规范）
- **禁止** delete 使用 `Modal.confirm`（Epics 明确指定 Popconfirm，适合低风险删除）

---

### 前端 UX 规范

| 元素 | 要求 |
|------|------|
| Tab 标签 | "基本信息" / "FAQ" / "SKU 变体" |
| 新增按钮 | `type="dashed"`，文字"+ 新增 FAQ"（UX-DR15：添加类操作） |
| 编辑/删除 | 表格操作列：`type="link"`（UX-DR15：行操作） |
| 删除确认 | `Popconfirm` 气泡（UX-DR16）—— Epics 明确要求，非 Modal |
| Modal 宽度 | 600px（UX-DR24 最大 720px） |
| 成功反馈 | `message.success` 3 秒（UX-DR17） |
| 失败反馈 | `message.error` 5 秒（UX-DR17） |
| 空状态 | FAQ 列表为空时：`<Empty description="暂无 FAQ 数据" />` + 新增按钮 |

---

## 完成标准

- [x] Migration 文件已创建，`spu_faqs` 表结构符合规范
- [x] 后端 8 个模块文件全部创建
- [x] `SpuFaqsModule` 已注册到 `app.module.ts`
- [x] `POST /api/spu-faqs` 创建时校验 spuId 对应的 SPU 存在
- [x] `GET /api/spu-faqs?spuId=X` 返回该 SPU 下所有 FAQ，按 sort_order ASC 排序
- [x] `PATCH /api/spu-faqs/:id` 更新成功，404 when not found
- [x] `DELETE /api/spu-faqs/:id` 删除成功，404 when not found
- [x] Service 单元测试全部通过（7/7）
- [x] 前端 API 层 `spu-faqs.api.ts` 已创建
- [x] `SpuFaqTab` 组件实现：列表展示、新增、编辑、删除
- [x] SPU 详情页改造为 Tabs 布局（基本信息 / FAQ / SKU 变体三标签）
- [x] 后端 TypeScript 编译无错误
- [x] 前端 TypeScript 编译无错误

---

## Review Findings

### Tasks / Subtasks (Review)

- [x] [Review][Patch] `message.success` 未显式传入 3 秒时长参数，违反 UX-DR17 [SpuFaqTab.tsx:43,55]
- [x] [Review][Defer] 迁移文件未在 DB 层为 `spu_id` 添加外键约束 [migration:20260422000200] — deferred, pre-existing project pattern
- [x] [Review][Defer] `spuId` TypeScript 类型为 `number`，但 DB 列为 `bigint`（潜在精度损失） [spu-faq.entity.ts, spu-faqs.api.ts] — deferred, pre-existing project-wide pattern
- [x] [Review][Defer] `Repository.update()` 两次独立查询非原子操作（update + findOneOrFail） [spu-faqs.repository.ts:28-31] — deferred, pre-existing pattern
- [x] [Review][Defer] `service.delete()` 存在 TOCTOU 竞态：findById 与 delete 非原子 [spu-faqs.service.ts:37-40] — deferred, pre-existing pattern
- [x] [Review][Defer] `normalizeApiError` 对非对象类型错误丢弃调用栈信息 [spu-faqs.api.ts:28-33] — deferred, minor DX issue
- [x] [Review][Defer] `UpdateSpuFaqDto` 允许完全空的 PATCH 请求体（无任何字段校验） [update-spu-faq.dto.ts] — deferred, acceptable current behavior
- [x] [Review][Defer] `answer` 字段缺少最大长度校验（DTO 和前端 TextArea 均无 maxLength） [create/update dto] — deferred, text column is intentionally unbounded
- [x] [Review][Defer] `spuId` 由客户端在请求体中传入，非路由参数 [controller+dto] — deferred, existing REST design pattern
- [x] [Review][Defer] 迁移 `down()` 未显式先删除索引再删表（依赖数据库引擎级联） [migration:40-42] — deferred, TypeORM handles automatically
- [x] [Review][Defer] `QuerySpuFaqDto.spuId` 缺失时 `@Type(() => Number)` 将 undefined 转换为 NaN [query-spu-faq.dto.ts] — deferred, framework guard handles 400 response

---

## 分支命名

`story/3-4-product-faq-management`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- 后端严格按照 7 文件模块标准实现（entity/dto×3/repository/service/controller/module）
- `UpdateSpuFaqDto` 手动声明可选字段，未使用 `PartialType`（项目无 `@nestjs/mapped-types`）
- Controller 使用 `@Query() query: QuerySpuFaqDto` 替代 `@Query('spuId', ParseIntPipe)`，保持与项目 DTO 校验规范一致
- 前端 API 层使用 `request.get<any, T>()` 模式（axios 拦截器已自动解包 `response.data.data`）
- `SpuFaqTab` 删除操作使用 `Popconfirm`（非 `Modal.confirm`），符合 UX-DR16 规范
- Service 单元测试 7/7 全部通过
- 后端/前端 TypeScript 编译均无错误

### File List

**新建文件（后端）：**
- `apps/api/src/modules/master-data/spu-faqs/entities/spu-faq.entity.ts`
- `apps/api/src/modules/master-data/spu-faqs/dto/create-spu-faq.dto.ts`
- `apps/api/src/modules/master-data/spu-faqs/dto/update-spu-faq.dto.ts`
- `apps/api/src/modules/master-data/spu-faqs/dto/query-spu-faq.dto.ts`
- `apps/api/src/modules/master-data/spu-faqs/spu-faqs.repository.ts`
- `apps/api/src/modules/master-data/spu-faqs/spu-faqs.service.ts`
- `apps/api/src/modules/master-data/spu-faqs/spu-faqs.controller.ts`
- `apps/api/src/modules/master-data/spu-faqs/spu-faqs.module.ts`
- `apps/api/src/migrations/20260422000200-create-spu-faqs-table.ts`
- `apps/api/src/modules/master-data/spu-faqs/tests/spu-faqs.service.spec.ts`

**新建文件（前端）：**
- `apps/web/src/api/spu-faqs.api.ts`
- `apps/web/src/pages/master-data/spus/components/SpuFaqTab.tsx`

**修改文件：**
- `apps/api/src/app.module.ts`（注册 SpuFaqsModule）
- `apps/web/src/pages/master-data/spus/detail.tsx`（改造为 Tabs 布局）

# Story 3.2: SPU 基础信息管理

Status: done

## Story

As a 产品专员,
I want 在产品分类下创建和管理 SPU（标准产品单元），记录品名、供应商、质保期和开票信息,
So that 每个产品系列有统一的基础档案，SKU 变体可以归属到正确的 SPU 下。

---

## Acceptance Criteria

**Given** 产品专员进入 SPU 列表页
**When** 页面加载完成
**Then** 展示 SPU 列表，含列：SPU 编码、SPU 名称、所属三级分类、单位、供应商、厂家型号、创建时间
**And** 支持按 SPU 名称/编码关键字搜索（debounce 300ms）、分页加载（默认 20 条/页）

**Given** 产品专员点击"新建 SPU"
**When** 进入 SPU 创建表单
**Then** 表单分组展示：基础信息（SPU 名称必填、所属分类必填、单位可选）、供应商信息（供应商、厂家型号、客户质保期、采购质保期、供应商质保说明）、开票信息（开票品名、开票单位、开票型号）、其他（禁止经营国家、公司主体）
**And** 所属分类使用 TreeSelect，仅允许选择 level=3 末级分类节点

**Given** 产品专员在 SPU 表单选择所属分类
**When** 选择三级分类（如"灯具 > 户外灯 > 洗墙灯"）
**Then** 仅 level=3 节点可选，level=1/2 节点不可选（selectable: false）
**And** 提交后 SPU 同时记录 category_id（三级）、category_level1_id、category_level2_id

**Given** 产品专员查看 SPU 详情页
**When** 页面加载完成
**Then** 展示 SPU 所有基础信息（分组卡片：基础信息、供应商信息、开票信息、其他）
**And** 展示 SKU 变体列表占位区（提示"SKU 变体将在后续版本实现"）
**And** 可点击"编辑"修改 SPU 信息，可点击"删除"删除 SPU

**Given** 后端 SPU API
**When** 查看实体设计
**Then** SPU 实体包含：id、spu_code（自动生成 SPU001 格式）、name、category_id、category_level1_id、category_level2_id、unit、manufacturer_model、customer_warranty_months、purchase_warranty_months、supplier_warranty_note、forbidden_countries、invoice_name、invoice_unit、invoice_model、supplier_name、company_id、created_at、updated_at、created_by、updated_by

---

## Tasks / Subtasks

### 后端：spus 模块

- [x] 创建 Entity `apps/api/src/modules/master-data/spus/entities/spu.entity.ts`
- [x] 创建 DTO：`create-spu.dto.ts`、`update-spu.dto.ts`、`query-spu.dto.ts`
- [x] 创建 Repository `spus.repository.ts`（含 findAll、findById、findByCode、create、update、delete、generateCode）
- [x] 创建 Service `spus.service.ts`（含 CRUD、分类校验、code 自动生成）
- [x] 创建 Controller `spus.controller.ts`（标准 CRUD 5 个端点）
- [x] 创建 Module `spus.module.ts`（import ProductCategoriesModule，export SpusService）
- [x] 创建 Migration `20260421000100-create-spus-table.ts`
- [x] 注册 SpusModule 到 `apps/api/src/app.module.ts`
- [x] 创建 Service 单元测试 `tests/spus.service.spec.ts`

### 前端：spus 页面

- [x] 创建 API 层 `apps/web/src/api/spus.api.ts`
- [x] 创建列表页 `apps/web/src/pages/master-data/spus/index.tsx`
- [x] 创建详情页 `apps/web/src/pages/master-data/spus/detail.tsx`
- [x] 创建表单页 `apps/web/src/pages/master-data/spus/form.tsx`
- [x] 在 `apps/web/src/App.tsx` 注册 4 条路由

---

## Dev Agent Context

### 与 Story 3.1 的关键差异

Story 3.1 是**树形结构**（product-categories），Story 3.2 是**标准列表 + 详情 + 表单**，与 Epic 2 的 companies 模块结构完全相同。

- 列表页：使用 `@ant-design/pro-components` 的 `ProTable`（参考 `companies/index.tsx`）
- 表单页：使用 `ProForm` + `ProCard` 分组（参考 `companies/form.tsx`）
- 详情页：参考 `companies/detail.tsx` 的 ProDescriptions 分组卡片

### 实际 BaseEntity 字段

```typescript
// apps/api/src/common/entities/base.entity.ts — 实际只有 5 个字段
abstract class BaseEntity {
  id: number;         // PrimaryGeneratedColumn bigint unsigned
  createdAt: Date;    // CreateDateColumn name='created_at'
  updatedAt: Date;    // UpdateDateColumn name='updated_at'
  createdBy: string;  // Column name='created_by' nullable
  updatedBy: string;  // Column name='updated_by' nullable
}
// 注意：无 deletedAt，无软删除
```

### 后端实现规范

#### Entity

```typescript
// apps/api/src/modules/master-data/spus/entities/spu.entity.ts
import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('spus')
@Unique('uq_spus_spu_code', ['spuCode'])
@Index('idx_spus_category_id', ['categoryId'])
@Index('idx_spus_name', ['name'])
export class Spu extends BaseEntity {
  @Column({ name: 'spu_code', type: 'varchar', length: 30 })
  @Expose()
  spuCode: string;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  name: string;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  @Expose()
  categoryId: number; // 三级分类 ID（level=3）

  @Column({ name: 'category_level1_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel1Id: number | null;

  @Column({ name: 'category_level2_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel2Id: number | null;

  @Column({ name: 'unit', type: 'varchar', length: 50, nullable: true })
  @Expose()
  unit: string | null;

  @Column({ name: 'manufacturer_model', type: 'varchar', length: 200, nullable: true })
  @Expose()
  manufacturerModel: string | null;

  @Column({ name: 'customer_warranty_months', type: 'int', unsigned: true, nullable: true })
  @Expose()
  customerWarrantyMonths: number | null;

  @Column({ name: 'purchase_warranty_months', type: 'int', unsigned: true, nullable: true })
  @Expose()
  purchaseWarrantyMonths: number | null;

  @Column({ name: 'supplier_warranty_note', type: 'text', nullable: true })
  @Expose()
  supplierWarrantyNote: string | null;

  @Column({ name: 'forbidden_countries', type: 'varchar', length: 500, nullable: true })
  @Expose()
  forbiddenCountries: string | null; // 逗号分隔的国家名称

  @Column({ name: 'invoice_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  invoiceName: string | null;

  @Column({ name: 'invoice_unit', type: 'varchar', length: 50, nullable: true })
  @Expose()
  invoiceUnit: string | null;

  @Column({ name: 'invoice_model', type: 'varchar', length: 200, nullable: true })
  @Expose()
  invoiceModel: string | null;

  @Column({ name: 'supplier_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  supplierName: string | null; // 供应商名称（文本，供应商模块在 Epic 4）

  @Column({ name: 'company_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  companyId: number | null; // 公司主体 ID（FK to companies）
}
```

#### Migration

文件名：`20260421000100-create-spus-table.ts`（参考 `20260420000400-create-product-categories-table.ts` 写法）

```typescript
// 列清单：
// id(bigint unsigned PK autoincrement)
// spu_code(varchar 30, not null)
// name(varchar 200, not null)
// category_id(bigint unsigned, not null)
// category_level1_id(bigint unsigned, nullable)
// category_level2_id(bigint unsigned, nullable)
// unit(varchar 50, nullable)
// manufacturer_model(varchar 200, nullable)
// customer_warranty_months(int unsigned, nullable)
// purchase_warranty_months(int unsigned, nullable)
// supplier_warranty_note(text, nullable)
// forbidden_countries(varchar 500, nullable)
// invoice_name(varchar 200, nullable)
// invoice_unit(varchar 50, nullable)
// invoice_model(varchar 200, nullable)
// supplier_name(varchar 200, nullable)
// company_id(bigint unsigned, nullable)
// created_at(datetime default CURRENT_TIMESTAMP)
// updated_at(datetime default CURRENT_TIMESTAMP onUpdate CURRENT_TIMESTAMP)
// created_by(varchar 100, nullable)
// updated_by(varchar 100, nullable)
//
// 索引：
// uq_spus_spu_code(spu_code, unique)
// idx_spus_category_id(category_id)
// idx_spus_name(name)
```

#### Repository

```typescript
// apps/api/src/modules/master-data/spus/spus.repository.ts

async findAll(query: QuerySpuDto) {
  const { keyword, page = 1, pageSize = 20, categoryId } = query;
  const qb = this.repo.createQueryBuilder('s');
  if (keyword) {
    qb.where('(s.name LIKE :kw OR s.spu_code LIKE :kw)', { kw: `%${keyword}%` });
  }
  if (categoryId !== undefined) {
    qb.andWhere('s.category_id = :categoryId', { categoryId });
  }
  const [list, total] = await qb
    .orderBy('s.created_at', 'DESC')
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();
  return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// generateCode 参考 product-categories.repository.ts 的 generateCode() 方法
// 格式：SPU001, SPU002, ...（前缀 'SPU'，查询 MAX(spu_code) WHERE spu_code LIKE 'SPU%'）
async generateCode(): Promise<string> {
  const result = await this.repo
    .createQueryBuilder('s')
    .select('MAX(s.spu_code)', 'maxCode')
    .where('s.spu_code LIKE :prefix', { prefix: 'SPU%' })
    .getRawOne<{ maxCode: string | null }>();
  const maxCode = result?.maxCode;
  let nextSeq = 1;
  if (maxCode) {
    const num = parseInt(maxCode.replace('SPU', ''), 10);
    if (!isNaN(num)) nextSeq = num + 1;
  }
  return `SPU${String(nextSeq).padStart(3, '0')}`;
}
```

#### Service

```typescript
// apps/api/src/modules/master-data/spus/spus.service.ts
// 注入：SpusRepository + ProductCategoriesService

async create(dto: CreateSpuDto, operator?: string) {
  // 1. 校验分类存在且 level=3（末级）
  const category = await this.categoriesService.findById(dto.categoryId);
  if (!category) throw new NotFoundException('产品分类不存在');
  if (category.level !== 3) throw new BadRequestException('只能选择三级（末级）分类');

  // 2. 通过 parentId 链路找 level1/level2 ID
  //    category.parentId → level2 category → level2.parentId → level1 category
  let categoryLevel2Id: number | null = null;
  let categoryLevel1Id: number | null = null;
  if (category.parentId) {
    const level2 = await this.categoriesService.findById(category.parentId);
    if (level2) {
      categoryLevel2Id = level2.id;
      if (level2.parentId) {
        const level1 = await this.categoriesService.findById(level2.parentId);
        if (level1) categoryLevel1Id = level1.id;
      }
    }
  }

  // 3. 自动生成 spu_code
  const spuCode = await this.repo.generateCode();

  return this.repo.create({
    spuCode,
    name: dto.name,
    categoryId: dto.categoryId,
    categoryLevel1Id,
    categoryLevel2Id,
    unit: dto.unit ?? null,
    manufacturerModel: dto.manufacturerModel ?? null,
    customerWarrantyMonths: dto.customerWarrantyMonths ?? null,
    purchaseWarrantyMonths: dto.purchaseWarrantyMonths ?? null,
    supplierWarrantyNote: dto.supplierWarrantyNote ?? null,
    forbiddenCountries: dto.forbiddenCountries ?? null,
    invoiceName: dto.invoiceName ?? null,
    invoiceUnit: dto.invoiceUnit ?? null,
    invoiceModel: dto.invoiceModel ?? null,
    supplierName: dto.supplierName ?? null,
    companyId: dto.companyId ?? null,
    createdBy: operator,
    updatedBy: operator,
  });
}

async update(id: number, dto: UpdateSpuDto, operator?: string) {
  const spu = await this.repo.findById(id);
  if (!spu) throw new NotFoundException('SPU 不存在');

  let categoryLevel1Id = spu.categoryLevel1Id;
  let categoryLevel2Id = spu.categoryLevel2Id;

  if (dto.categoryId !== undefined && dto.categoryId !== spu.categoryId) {
    const category = await this.categoriesService.findById(dto.categoryId);
    if (!category) throw new NotFoundException('产品分类不存在');
    if (category.level !== 3) throw new BadRequestException('只能选择三级（末级）分类');
    // 重新计算 level1/level2
    categoryLevel2Id = null;
    categoryLevel1Id = null;
    if (category.parentId) {
      const level2 = await this.categoriesService.findById(category.parentId);
      if (level2) {
        categoryLevel2Id = level2.id;
        if (level2.parentId) {
          const level1 = await this.categoriesService.findById(level2.parentId);
          if (level1) categoryLevel1Id = level1.id;
        }
      }
    }
  }

  return this.repo.update(id, { ...dto, categoryLevel1Id, categoryLevel2Id, updatedBy: operator });
}

async delete(id: number): Promise<void> {
  const spu = await this.repo.findById(id);
  if (!spu) throw new NotFoundException('SPU 不存在');
  await this.repo.delete(id);
}
```

#### Controller 端点

```typescript
@Controller('spus')
export class SpusController {
  @Get()              // GET /api/v1/spus → 分页列表
  findAll(@Query() query: QuerySpuDto)

  @Get(':id')         // GET /api/v1/spus/:id → 单条详情
  findById(@Param('id', ParseIntPipe) id: number)

  @Post()             // POST /api/v1/spus → 创建
  create(@Body() dto: CreateSpuDto, @CurrentUser() user)

  @Patch(':id')       // PATCH /api/v1/spus/:id → 更新
  update(@Param('id', ParseIntPipe) id, @Body() dto: UpdateSpuDto, @CurrentUser() user)

  @Delete(':id')      // DELETE /api/v1/spus/:id → 删除（204）
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number)
}
```

#### Module

```typescript
// apps/api/src/modules/master-data/spus/spus.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Spu]),
    ProductCategoriesModule, // 需要 ProductCategoriesService 校验分类层级
  ],
  controllers: [SpusController],
  providers: [SpusRepository, SpusService],
  exports: [SpusService],
})
export class SpusModule {}
```

**重要**：`ProductCategoriesModule` 已在 `product-categories.module.ts` 中 `exports: [ProductCategoriesService]`，可直接 import。

#### 注册到 AppModule

```typescript
// apps/api/src/app.module.ts
import { SpusModule } from './modules/master-data/spus/spus.module';
// 在 imports 数组中添加 SpusModule（放在 ProductCategoriesModule 之后）
```

#### DTO 设计

```typescript
// create-spu.dto.ts
class CreateSpuDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsInt() @IsPositive() categoryId: number; // 必须是 level=3 分类
  @IsString() @IsOptional() @MaxLength(50) unit?: string;
  @IsString() @IsOptional() @MaxLength(200) manufacturerModel?: string;
  @IsInt() @IsOptional() @Min(0) customerWarrantyMonths?: number;
  @IsInt() @IsOptional() @Min(0) purchaseWarrantyMonths?: number;
  @IsString() @IsOptional() supplierWarrantyNote?: string;
  @IsString() @IsOptional() @MaxLength(500) forbiddenCountries?: string;
  @IsString() @IsOptional() @MaxLength(200) invoiceName?: string;
  @IsString() @IsOptional() @MaxLength(50) invoiceUnit?: string;
  @IsString() @IsOptional() @MaxLength(200) invoiceModel?: string;
  @IsString() @IsOptional() @MaxLength(200) supplierName?: string;
  @IsInt() @IsOptional() @IsPositive() companyId?: number;
}

// update-spu.dto.ts — 所有字段可选（PartialType(CreateSpuDto) 即可）

// query-spu.dto.ts — 继承 BaseQueryDto
class QuerySpuDto extends BaseQueryDto {
  @Type(() => Number) @IsInt() @IsOptional() categoryId?: number; // 按三级分类过滤
}
```

### 前端实现规范

#### API 层

```typescript
// apps/web/src/api/spus.api.ts
// 参考 companies.api.ts 的结构：export interface + export function + normalizeApiError

export interface Spu {
  id: number;
  spuCode: string;
  name: string;
  categoryId: number;
  categoryLevel1Id: number | null;
  categoryLevel2Id: number | null;
  unit: string | null;
  manufacturerModel: string | null;
  customerWarrantyMonths: number | null;
  purchaseWarrantyMonths: number | null;
  supplierWarrantyNote: string | null;
  forbiddenCountries: string | null;
  invoiceName: string | null;
  invoiceUnit: string | null;
  invoiceModel: string | null;
  supplierName: string | null;
  companyId: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// API 函数：getSpus(params) / getSpuById(id) / createSpu(payload) / updateSpu(id, payload) / deleteSpu(id)
```

#### 列表页（index.tsx）

参考 `companies/index.tsx`，使用 `ProTable`：

```typescript
// apps/web/src/pages/master-data/spus/index.tsx
// - ProTable 列：SPU 编码、SPU 名称（蓝色链接跳详情）、所属分类（需要展示分类名称，见下方注意）、单位、供应商、厂家型号、创建时间、操作列
// - 搜索：keyword input（debounce 300ms）
// - 分页：page/pageSize state，useQuery queryKey: ['spus', keyword, page, pageSize]
// - 新建按钮：navigate('/master-data/spus/create')
```

**分类名称展示**：SPU 只存了 `categoryId`，列表页需要展示分类名称。方案：
1. 同时请求 `GET /product-categories/tree` 获取分类树
2. 在前端通过 `categoryId` 查找对应节点名称
3. 使用 `useQuery(['product-categories', 'tree'], getProductCategoryTree)` 复用缓存

#### 表单页（form.tsx）

参考 `companies/form.tsx`，使用 `ProForm` + `ProCard`：

```typescript
// apps/web/src/pages/master-data/spus/form.tsx
// 分组卡片：
// ProCard title="基础信息"：SPU 名称（必填）、所属分类（必填，TreeSelect）、单位
// ProCard title="供应商信息"：供应商、厂家型号、客户质保期(月)、采购质保期(月)、供应商质保说明
// ProCard title="开票信息"：开票品名、开票单位、开票型号
// ProCard title="其他"：禁止经营国家、公司主体（Select，从 /companies 获取）

// 所属分类 TreeSelect：
// - 数据来源：getProductCategoryTree()
// - 将 ProductCategoryNode[] 转换为 antd TreeSelect 的 treeData 格式
// - level < 3 的节点设 disabled: true（不可选）
// - 提交时只传 categoryId（后端自动推导 level1/level2）

// 公司主体 Select：
// - 数据来源：getCompanies({ pageSize: 100 })
// - 选项格式：{ label: company.nameCn, value: company.id }

// 提交成功后：navigate(`/master-data/spus/${data.id}`)
// 编辑成功后：navigate(`/master-data/spus/${spuId}`)
```

#### 详情页（detail.tsx）

```typescript
// apps/web/src/pages/master-data/spus/detail.tsx
// 参考 companies/detail.tsx 的 ProDescriptions 分组卡片结构
// 分组：基础信息、供应商信息、开票信息、其他
// 顶部操作按钮：编辑（navigate to form）、删除（Modal.confirm）
// SKU 占位区：Empty + "SKU 变体将在后续版本实现"
```

#### App.tsx 新增路由

```typescript
import SpusListPage from './pages/master-data/spus/index';
import SpuDetailPage from './pages/master-data/spus/detail';
import SpuFormPage from './pages/master-data/spus/form';

// 在 product-categories 路由之后添加：
<Route path="/master-data/spus" element={<SpusListPage />} />
<Route path="/master-data/spus/create" element={<SpuFormPage />} />
<Route path="/master-data/spus/:id" element={<SpuDetailPage />} />
<Route path="/master-data/spus/:id/edit" element={<SpuFormPage />} />
```

### 关键文件路径

| 文件 | 路径 | 操作 |
|------|------|------|
| Entity | `apps/api/src/modules/master-data/spus/entities/spu.entity.ts` | 新建 |
| CreateDto | `apps/api/src/modules/master-data/spus/dto/create-spu.dto.ts` | 新建 |
| UpdateDto | `apps/api/src/modules/master-data/spus/dto/update-spu.dto.ts` | 新建 |
| QueryDto | `apps/api/src/modules/master-data/spus/dto/query-spu.dto.ts` | 新建 |
| Repository | `apps/api/src/modules/master-data/spus/spus.repository.ts` | 新建 |
| Service | `apps/api/src/modules/master-data/spus/spus.service.ts` | 新建 |
| Controller | `apps/api/src/modules/master-data/spus/spus.controller.ts` | 新建 |
| Module | `apps/api/src/modules/master-data/spus/spus.module.ts` | 新建 |
| Migration | `apps/api/src/migrations/20260421000100-create-spus-table.ts` | 新建 |
| Service Spec | `apps/api/src/modules/master-data/spus/tests/spus.service.spec.ts` | 新建 |
| AppModule | `apps/api/src/app.module.ts` | 修改（添加 SpusModule） |
| API layer | `apps/web/src/api/spus.api.ts` | 新建 |
| 列表页 | `apps/web/src/pages/master-data/spus/index.tsx` | 新建 |
| 详情页 | `apps/web/src/pages/master-data/spus/detail.tsx` | 新建 |
| 表单页 | `apps/web/src/pages/master-data/spus/form.tsx` | 新建 |
| 路由注册 | `apps/web/src/App.tsx` | 修改（添加 4 条路由） |

### 已存在、直接复用的基础设施

| 基础设施 | 路径 | 使用方式 |
|---------|------|---------|
| BaseEntity | `apps/api/src/common/entities/base.entity.ts` | Entity 继承 |
| BaseQueryDto | `apps/api/src/common/dto/base-query.dto.ts` | QueryDto 继承 |
| CurrentUser 装饰器 | `apps/api/src/common/decorators/current-user.decorator.ts` | Controller 注入 |
| ProductCategoriesService | `product-categories.module.ts` exports | SpusModule import |
| getProductCategoryTree | `apps/web/src/api/product-categories.api.ts` | 表单 TreeSelect 数据 |
| getCompanies | `apps/web/src/api/companies.api.ts` | 表单公司主体 Select 数据 |
| request（axios） | `apps/web/src/api/request.ts` | API 层 import |
| useDebouncedValue | `apps/web/src/hooks/useDebounce.ts` | 列表页搜索 debounce |

### 测试要求

```
测试文件：apps/api/src/modules/master-data/spus/tests/spus.service.spec.ts
参考：apps/api/src/modules/master-data/product-categories/tests/product-categories.service.spec.ts

it('创建 SPU 成功，自动生成 spu_code SPU001')
it('创建 SPU 时分类不存在 → NotFoundException')
it('创建 SPU 时分类 level=1 → BadRequestException（只能选末级）')
it('创建 SPU 时分类 level=2 → BadRequestException（只能选末级）')
it('创建 SPU 时分类 level=3 → 成功，正确推导 level1/level2 ID')
it('更新 SPU 名称成功')
it('更新 SPU 时 categoryId 变更 → 重新校验并更新 level1/level2')
it('更新不存在的 SPU → NotFoundException')
it('删除 SPU 成功')
it('删除不存在的 SPU → NotFoundException')
```

### 禁止事项（Anti-Patterns）

- **禁止** 在 Controller 中直接访问 Repository（必须通过 Service 层）
- **禁止** 在 Entity 中省略 `@Column({ name: 'snake_case' })` 和 `@Expose()`
- **禁止** 将 `spu_code` 由前端传入（必须由 Service 自动生成）
- **禁止** 允许选择 level=1/2 分类（前端 TreeSelect disabled，后端 Service 校验）
- **禁止** 在前端组件中直接 import axios（必须通过 `src/api/spus.api.ts` 层）
- **禁止** 使用 `useState` 管理服务端数据（必须 TanStack Query）
- **禁止** 在 SpusModule 中重新实现分类查询（复用 ProductCategoriesService）

### 历史 Story 关键经验

来自 Story 3.1（product-categories）的经验：
- `ProductCategoriesModule` 已 `exports: [ProductCategoriesService]`，SpusModule 直接 import 即可
- `GET /product-categories/tree` 返回完整嵌套树，前端可复用 `queryKey: ['product-categories', 'tree']` 缓存
- 分类节点的 `parentId` 链路：level3.parentId → level2.id，level2.parentId → level1.id

来自 Story 2.3（companies）的经验：
- `App.tsx` 是手动路由注册（非 lazy loading），直接 import 组件后添加 `<Route>`
- 表单中跨模块数据（如货币）直接在 form.tsx 内调用 request，不需要经过本模块 api 文件
- `ProForm` + `ProCard` 分组是中等复杂度表单的标准模式

来自 deferred-work.md 的注意事项：
- `bigint` DB 列（company_id 等）TypeScript 层类型为 `number`，项目级已知问题，保持一致即可
- TOCTOU 竞态（create 中的唯一性检查）超出本 Story 范围，不需要处理

---

## 前端 UX 规范

### 列表页

| 元素 | 要求 |
|------|------|
| 页面标题 | "SPU 管理" |
| 新建按钮 | Primary，右上角，"+ 新建 SPU" |
| 搜索框 | 单一搜索框，placeholder "搜索 SPU 名称/编码..." |
| 表格列 | SPU 编码、SPU 名称（蓝色链接）、所属分类、单位、供应商、厂家型号、创建时间、操作（查看/编辑） |
| 空状态 | Empty + "暂无 SPU 数据" |

### 表单页

| 元素 | 要求 |
|------|------|
| 布局 | 中等表单（~14 字段）：分组 ProCard |
| 所属分类 | 必填，TreeSelect，level<3 节点 disabled |
| SPU 名称 | 必填，红色星号 |
| 提交反馈 | message.success 3 秒 |
| 取消 | navigate(-1) 返回上一页 |

---

## 完成标准

- [ ] Migration 文件已创建，表结构符合规范
- [ ] 后端 8 个模块文件全部创建
- [ ] `SpusModule` 已注册到 `app.module.ts`
- [ ] `POST /api/v1/spus` 创建时校验分类 level=3，自动生成 spu_code
- [ ] `GET /api/v1/spus` 支持 keyword 搜索和 categoryId 过滤
- [ ] Service 单元测试全部通过
- [ ] 前端 API 层 `spus.api.ts` 已创建
- [ ] 前端列表页正常工作（搜索、分页、跳详情）
- [ ] 前端表单页正常工作（TreeSelect 仅末级可选，公司主体下拉）
- [ ] 前端详情页正常工作（分组展示、编辑/删除操作）
- [ ] App.tsx 中 4 条路由已注册
- [ ] 后端 TypeScript 编译无错误
- [ ] 前端 TypeScript 编译无错误

---

## 分支命名

`story/3-2-spu基础信息管理`

---

## Senior Developer Review (AI)

**Review Date:** 2026-04-21
**Outcome:** Changes Requested
**Reviewer:** claude-sonnet-4-6[1m]

### Review Findings

#### Patch（需修复）

- [x] [Review][Patch] `generateCode` 字符串 MAX 在序号 > 999 时失效 [spus.repository.ts:42] — 已修复：改用 `CAST(SUBSTRING(spu_code, 4) AS UNSIGNED)` 数字排序
- [x] [Review][Patch] `useDebouncedValue` 内联重复，应从 `hooks/useDebounce.ts` 导入 [spus/index.tsx:11] — 已修复
- [x] [Review][Patch] `findCategoryName` 在 index.tsx 和 detail.tsx 中重复定义，应提取为共享工具函数 [spus/index.tsx:20, detail.tsx:10] — 已修复：提取到 `utils/category.ts`
- [x] [Review][Patch] `updateMutation` 类型错误，使用了 `CreateSpuPayload` 而非 `UpdateSpuPayload` [form.tsx:70] — 已修复
- [x] [Review][Patch] `UpdateSpuDto` 手动重复所有字段，应使用 `PartialType(CreateSpuDto)` [update-spu.dto.ts] — dismissed：项目未安装 `@nestjs/mapped-types`，与其他模块保持一致

#### Defer（延后处理）

- [x] [Review][Defer] `findByCode` 方法未被调用（死代码）[spus.repository.ts:35] — deferred, pre-existing
- [x] [Review][Defer] 详情页显示公司主体 ID 而非公司名称 [detail.tsx:110] — deferred, Epic 4 供应商/公司集成后处理
- [x] [Review][Defer] `generateCode` TOCTOU 竞态（已在 deferred-work.md 记录）— deferred, pre-existing

### Tasks/Subtasks — Review Follow-ups (AI)

- [x] [AI-Review][Patch] 修复 `generateCode` 字符串 MAX 问题（改用数字排序或 CAST）
- [x] [AI-Review][Patch] 将 `useDebouncedValue` 改为从 `hooks/useDebounce.ts` 导入
- [x] [AI-Review][Patch] 提取 `findCategoryName` 为共享工具函数
- [x] [AI-Review][Patch] 修复 `updateMutation` 类型为 `UpdateSpuPayload`
- [x] [AI-Review][Patch] 将 `UpdateSpuDto` 改为 `PartialType(CreateSpuDto)` — dismissed，项目未安装 mapped-types

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6[1m]

### Debug Log References

### Completion Notes List

- 后端：创建 spus 模块（entity、3 个 DTO、repository、service、controller、module），注册到 app.module.ts
- Migration：20260421000100-create-spus-table.ts，含 uq_spus_spu_code 唯一索引和 idx_spus_category_id/idx_spus_name 索引
- Service 单元测试 10 个全部通过，覆盖创建/更新/删除的正常和异常路径
- 前端：spus.api.ts、列表页（ProTable + debounce 搜索 + 分类名称展示）、详情页（ProDescriptions 分组 + 删除确认 + SKU 占位）、表单页（TreeSelect 仅末级可选 + 公司主体 Select）
- App.tsx 注册 4 条路由；修复预先存在的 product-categories/index.tsx 未使用 import 警告
- 后端/前端 TypeScript 编译均无错误

### File List

- apps/api/src/modules/master-data/spus/entities/spu.entity.ts（新建）
- apps/api/src/modules/master-data/spus/dto/create-spu.dto.ts（新建）
- apps/api/src/modules/master-data/spus/dto/update-spu.dto.ts（新建）
- apps/api/src/modules/master-data/spus/dto/query-spu.dto.ts（新建）
- apps/api/src/modules/master-data/spus/spus.repository.ts（新建）
- apps/api/src/modules/master-data/spus/spus.service.ts（新建）
- apps/api/src/modules/master-data/spus/spus.controller.ts（新建）
- apps/api/src/modules/master-data/spus/spus.module.ts（新建）
- apps/api/src/modules/master-data/spus/tests/spus.service.spec.ts（新建）
- apps/api/src/migrations/20260421000100-create-spus-table.ts（新建）
- apps/api/src/app.module.ts（修改：添加 SpusModule）
- apps/web/src/api/spus.api.ts（新建）
- apps/web/src/pages/master-data/spus/index.tsx（新建）
- apps/web/src/pages/master-data/spus/detail.tsx（新建）
- apps/web/src/pages/master-data/spus/form.tsx（新建）
- apps/web/src/App.tsx（修改：添加 4 条 SPU 路由）
- apps/web/src/pages/master-data/product-categories/index.tsx（修改：移除未使用 import）

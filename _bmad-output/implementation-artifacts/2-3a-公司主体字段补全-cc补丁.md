# Story 2-3a: 公司主体字段补全（CC 补丁）

Status: done

## Story

As a 系统管理员,
I want 公司主体记录能完整记录英文名称、简称、国家/地区、地址、联系信息及总账会计,
So that 采购订单、物流单等下游模块可引用完整的签约主体信息。

> **背景**：Story 2-3 实现公司主体模块时，未对照 `docs/系统模块对应字段清单.md`
> 公司主体信息管理表单（FormUUID: FORM-B5DBD282A699422AAC1B879CA78D8744KORM），
> 仅包含 9 个字段（公司名称/签订地点/银行四字段/合规三字段），缺失 11 个业务字段。
> 本 Story 为纯字段补丁，**不新增 API 端点，不改变现有逻辑**，只在已有公司主体模块各层追加字段并完成 TS 属性重命名。

---

## Acceptance Criteria

**Given** 管理员进入新建/编辑公司主体表单
**When** 填写公司主体信息提交
**Then** 表单可选填公司英文名称（nameEn）、公司简称（abbreviation）
**And** 可通过搜索下拉选择国家/地区（countryId + countryName 软引用）
**And** 可填写中文地址（addressCn）和英文地址（addressEn）
**And** 可填写联系人（contactPerson）和联系电话（contactPhone）
**And** 可通过搜索下拉选择总账会计（chiefAccountantId + chiefAccountantName 软引用 users）
**And** 选择默认币种时同时写入币种名称（defaultCurrencyName）

**Given** 管理员查看公司主体详情页
**When** 记录包含新增字段数据
**Then** 详情页正确展示地址信息组（中文地址/英文地址）和联系信息组（联系人/联系电话/总账会计）

**Given** 数据库已运行 Story 2-3 的 Migration（companies 表已存在）
**When** 执行本补丁 Migration
**Then** `companies` 表新增 11 列，现有数据不受影响（所有新列均 NULL）

**Given** 开发者运行 TypeScript 编译
**When** Entity / DTO / 前端 API 层均已完成 name→nameCn 重命名及新字段添加
**Then** `tsc --noEmit` 零报错

---

## Tasks / Subtasks

### 1. 后端：Entity 重命名 + 追加字段

- [ ] 编辑 `apps/api/src/modules/master-data/companies/entities/company.entity.ts`
  - 将 `@Unique('idx_companies_name', ['name'])` 改为 `@Unique('idx_companies_name', ['nameCn'])`
  - 将属性 `name: string` 改为 `nameCn: string`，保留 `@Column({ name: 'name', ... })`
  - 追加 11 个新字段（见下方"字段清单"）

### 2. 后端：Migration

- [ ] 创建 `apps/api/src/migrations/20260420001300-alter-companies-add-fields.ts`
  - `up()`: ALTER TABLE ADD COLUMN × 11
  - `down()`: ALTER TABLE DROP COLUMN × 11（逆序）

### 3. 后端：DTO 更新

- [ ] 编辑 `apps/api/src/modules/master-data/companies/dto/create-company.dto.ts`
  - 将 `name: string` 改为 `nameCn: string`
  - 追加 11 个可选字段
- [ ] 编辑 `apps/api/src/modules/master-data/companies/dto/update-company.dto.ts`
  - 与 CreateCompanyDto 同步（重命名 + 追加，全部 optional）
- [ ] **不修改** QueryCompanyDto（不新增筛选维度）

### 4. 后端：Repository 更新

- [ ] 编辑 `apps/api/src/modules/master-data/companies/companies.repository.ts`
  - `findByName(name: string)` → `findByName(nameCn: string)`
  - 查询条件 `{ where: { name } }` → `{ where: { nameCn } }`
  - `findAll` 中关键词搜索列需同步更新为 `company.nameCn`（Entity 属性名变更）

### 5. 后端：Service 更新

- [ ] 编辑 `apps/api/src/modules/master-data/companies/companies.service.ts`
  - `create()`: `dto.name` → `dto.nameCn`，追加所有新字段的传递
  - `update()`: 唯一性检查 `dto.name` → `dto.nameCn`，`company.name` → `company.nameCn`
  - `findByName` 调用参数同步更新

### 6. 前端：API 层更新

- [ ] 编辑 `apps/web/src/api/companies.api.ts`
  - `Company` 接口：`name: string` → `nameCn: string`，追加 11 个字段（可选类型）
  - `CreateCompanyPayload`：`name` → `nameCn`，追加可选字段
  - `UpdateCompanyPayload`：同步

### 7. 前端：列表页更新

- [ ] 编辑 `apps/web/src/pages/master-data/companies/index.tsx`
  - ProTable 列定义：`dataIndex: 'name'` → `dataIndex: 'nameCn'`
  - 列标题由"公司名称"保持不变（label 不变，仅 dataIndex 变）

### 8. 前端：表单页更新

- [ ] 编辑 `apps/web/src/pages/master-data/companies/form.tsx`
  - 基本信息组：字段名 `name` → `nameCn`，新增 nameEn / abbreviation / 国家搜索下拉
  - 新增"地址信息"分组：addressCn / addressEn
  - 新增"联系信息"分组：contactPerson / contactPhone / 总账会计搜索下拉
  - 银行信息组：默认币种选中时同步写入 defaultCurrencyName
  - initialValues 更新（编辑模式回填）

### 9. 前端：详情页更新

- [ ] 编辑 `apps/web/src/pages/master-data/companies/detail.tsx`
  - 基本信息组：`dataIndex: 'name'` → `'nameCn'`，新增 nameEn / abbreviation / countryName
  - 新增"地址信息"ProDescriptions 分组：addressCn / addressEn
  - 新增"联系信息"ProDescriptions 分组：contactPerson / contactPhone / chiefAccountantName

### 10. 测试更新

- [ ] 编辑 `apps/api/src/modules/master-data/companies/tests/companies.service.spec.ts`
  - 将 `name` 相关测试字段改为 `nameCn`
  - 补充新字段（addressCn、chiefAccountantName）存入的测试用例

---

## Dev Agent Context

### 关键约束（严格遵守）

- **这是纯补丁 Story，禁止新增 API 端点或修改路由结构**
- **禁止修改 AppModule、Sidebar.tsx、App.tsx**（公司主体模块已注册）
- **Entity 属性重命名：`name` → `nameCn`，DB 列名必须保持 `name`（通过 `@Column({ name: 'name' })` 映射）**
- **`@Unique` 装饰器必须同步更新引用属性名 `['nameCn']`，否则 TypeORM 报错**
- **每个新字段必须同时加 `@Expose()` 和 `@Column({ name: 'snake_case' })`**
- **Migration 必须包含 down() 方法**（DROP COLUMN 逆序）
- **软引用字段（countryId / chiefAccountantId）类型为 `bigint`，TypeScript 层为 `number | null`**
- **前端 id 类型必须为 `number`（非 string）**，与 BaseEntity.id 模式一致

### Entity 变更完整规范

```typescript
// apps/api/src/modules/master-data/companies/entities/company.entity.ts
import { Column, Entity, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('companies')
@Unique('idx_companies_name', ['nameCn'])  // 属性名改为 nameCn
export class Company extends BaseEntity {

  // ──── 重命名字段（DB 列名不变）────
  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  nameCn: string;  // 原来的 name → nameCn

  @Column({ name: 'signing_location', type: 'varchar', length: 200, nullable: true })
  @Expose()
  signingLocation: string | null;

  // … 其余已有字段保持不变（bankName / bankAccount / swiftCode /
  //   defaultCurrencyCode / taxId / customsCode / quarantineCode）…

  // ──── 新增字段 ────
  @Column({ name: 'name_en', type: 'varchar', length: 200, nullable: true })
  @Expose()
  nameEn: string | null;

  @Column({ name: 'abbreviation', type: 'varchar', length: 50, nullable: true })
  @Expose()
  abbreviation: string | null;

  @Column({ name: 'country_id', type: 'bigint', nullable: true })
  @Expose()
  countryId: number | null;

  @Column({ name: 'country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  countryName: string | null;

  @Column({ name: 'address_cn', type: 'varchar', length: 500, nullable: true })
  @Expose()
  addressCn: string | null;

  @Column({ name: 'address_en', type: 'varchar', length: 500, nullable: true })
  @Expose()
  addressEn: string | null;

  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: true })
  @Expose()
  contactPerson: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  @Expose()
  contactPhone: string | null;

  @Column({ name: 'default_currency_name', type: 'varchar', length: 50, nullable: true })
  @Expose()
  defaultCurrencyName: string | null;

  @Column({ name: 'chief_accountant_id', type: 'bigint', nullable: true })
  @Expose()
  chiefAccountantId: number | null;

  @Column({ name: 'chief_accountant_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  chiefAccountantName: string | null;
}
```

> **注意**：新字段插入位置建议在 `quarantineCode` 之后追加，保持已有字段顺序不变。

### Migration 文件完整规范

```typescript
// apps/api/src/migrations/20260420001300-alter-companies-add-fields.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCompaniesAddFields20260420001300 implements MigrationInterface {
  name = 'AlterCompaniesAddFields20260420001300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
        ADD COLUMN \`name_en\`               varchar(200) NULL COMMENT '公司英文名称',
        ADD COLUMN \`abbreviation\`          varchar(50)  NULL COMMENT '公司简称',
        ADD COLUMN \`country_id\`            bigint       NULL COMMENT '国家/地区ID（软引用 countries）',
        ADD COLUMN \`country_name\`          varchar(100) NULL COMMENT '国家/地区名称',
        ADD COLUMN \`address_cn\`            varchar(500) NULL COMMENT '中文地址',
        ADD COLUMN \`address_en\`            varchar(500) NULL COMMENT '英文地址',
        ADD COLUMN \`contact_person\`        varchar(100) NULL COMMENT '联系人',
        ADD COLUMN \`contact_phone\`         varchar(50)  NULL COMMENT '联系电话',
        ADD COLUMN \`default_currency_name\` varchar(50)  NULL COMMENT '默认币种名称（冗余）',
        ADD COLUMN \`chief_accountant_id\`   bigint       NULL COMMENT '总账会计用户ID（软引用 users）',
        ADD COLUMN \`chief_accountant_name\` varchar(100) NULL COMMENT '总账会计姓名'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
        DROP COLUMN \`chief_accountant_name\`,
        DROP COLUMN \`chief_accountant_id\`,
        DROP COLUMN \`default_currency_name\`,
        DROP COLUMN \`contact_phone\`,
        DROP COLUMN \`contact_person\`,
        DROP COLUMN \`address_en\`,
        DROP COLUMN \`address_cn\`,
        DROP COLUMN \`country_name\`,
        DROP COLUMN \`country_id\`,
        DROP COLUMN \`abbreviation\`,
        DROP COLUMN \`name_en\`
    `);
  }
}
```

### DTO 完整更新规范

#### create-company.dto.ts（重命名 + 追加）

```typescript
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  // ──── 重命名 ────
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameCn: string;  // 原 name → nameCn

  @IsString()
  @IsOptional()
  @MaxLength(200)
  signingLocation?: string;

  // … 原有其他字段保持不变 …
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  bankAccount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  swiftCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  defaultCurrencyCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  taxId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  customsCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  quarantineCode?: string;

  // ──── 新增字段 ────
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  abbreviation?: string;

  @IsNumber()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressCn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  defaultCurrencyName?: string;

  @IsNumber()
  @IsOptional()
  chiefAccountantId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  chiefAccountantName?: string;
}
```

`update-company.dto.ts`：全部字段改为 `?` optional，与 CreateCompanyDto 同结构。

### Repository 更新规范

```typescript
// companies.repository.ts 修改部分

findByName(nameCn: string): Promise<Company | null> {
  return this.repo.findOne({ where: { nameCn } });
}

async findAll(query: QueryCompanyDto) {
  const { keyword, page = 1, pageSize = 20 } = query;
  const qb = this.repo.createQueryBuilder('company');

  if (keyword) {
    // 原来搜索 company.name，现改为搜索 company.nameCn
    // 注意：TypeORM 用的是 DB 列名 'name'，但 QBuilder 用实体属性名 'nameCn'
    qb.where('company.nameCn LIKE :kw', { kw: `%${keyword}%` });
  }

  // 其余分页逻辑不变
}
```

> **重要**：QueryBuilder 中 `company.nameCn` 使用的是 **TypeORM 实体属性名**（不是 DB 列名），TypeORM 会自动映射为 `company.name`。

### Service 更新规范

```typescript
// companies.service.ts 修改部分

async create(dto: CreateCompanyDto, operator?: string): Promise<Company> {
  const duplicate = await this.companiesRepository.findByName(dto.nameCn);  // 改为 nameCn
  if (duplicate) {
    throw new BadRequestException('公司名称已存在');
  }

  return this.companiesRepository.create({
    nameCn: dto.nameCn,              // 原 name → nameCn
    signingLocation: dto.signingLocation ?? null,
    bankName: dto.bankName ?? null,
    bankAccount: dto.bankAccount ?? null,
    swiftCode: dto.swiftCode ?? null,
    defaultCurrencyCode: dto.defaultCurrencyCode ?? null,
    taxId: dto.taxId ?? null,
    customsCode: dto.customsCode ?? null,
    quarantineCode: dto.quarantineCode ?? null,
    // 新增字段
    nameEn: dto.nameEn ?? null,
    abbreviation: dto.abbreviation ?? null,
    countryId: dto.countryId ?? null,
    countryName: dto.countryName ?? null,
    addressCn: dto.addressCn ?? null,
    addressEn: dto.addressEn ?? null,
    contactPerson: dto.contactPerson ?? null,
    contactPhone: dto.contactPhone ?? null,
    defaultCurrencyName: dto.defaultCurrencyName ?? null,
    chiefAccountantId: dto.chiefAccountantId ?? null,
    chiefAccountantName: dto.chiefAccountantName ?? null,
    createdBy: operator,
    updatedBy: operator,
  });
}

async update(id: number, dto: UpdateCompanyDto, operator?: string): Promise<Company> {
  const company = await this.companiesRepository.findById(id);
  if (!company) throw new NotFoundException('公司主体不存在');

  if (dto.nameCn && dto.nameCn !== company.nameCn) {  // 改为 nameCn
    const duplicate = await this.companiesRepository.findByName(dto.nameCn);
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException('公司名称已存在');
    }
  }

  return this.companiesRepository.update(id, { ...dto, updatedBy: operator });
}
```

### 前端 API 层更新（companies.api.ts）

```typescript
export interface Company {
  id: number;
  nameCn: string;         // 原 name → nameCn
  signingLocation: string | null;
  bankName: string | null;
  bankAccount: string | null;
  swiftCode: string | null;
  defaultCurrencyCode: string | null;
  taxId: string | null;
  customsCode: string | null;
  quarantineCode: string | null;
  // 新增字段
  nameEn?: string | null;
  abbreviation?: string | null;
  countryId?: number | null;
  countryName?: string | null;
  addressCn?: string | null;
  addressEn?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  defaultCurrencyName?: string | null;
  chiefAccountantId?: number | null;
  chiefAccountantName?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCompanyPayload {
  nameCn: string;         // 原 name → nameCn
  signingLocation?: string;
  bankName?: string;
  bankAccount?: string;
  swiftCode?: string;
  defaultCurrencyCode?: string;
  taxId?: string;
  customsCode?: string;
  quarantineCode?: string;
  // 新增字段
  nameEn?: string;
  abbreviation?: string;
  countryId?: number;
  countryName?: string;
  addressCn?: string;
  addressEn?: string;
  contactPerson?: string;
  contactPhone?: string;
  defaultCurrencyName?: string;
  chiefAccountantId?: number;
  chiefAccountantName?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;
```

### 前端列表页更新（index.tsx）

仅需修改 ProTable columns 定义中 `name` → `nameCn`：

```typescript
// 修改前：
{ title: '公司名称', dataIndex: 'name', ... }
// 修改后：
{ title: '公司名称', dataIndex: 'nameCn', ... }
```

> 搜索 keyword 仍按后端接口传入，不需改动；列表页标题和路由保持不变。

### 前端表单页更新（form.tsx）

**完整变更：**

```tsx
// 1. 基本信息组 —— 重命名 name → nameCn，新增 nameEn / abbreviation / 国家搜索
<ProCard title="基本信息" bordered style={{ marginBottom: 16 }}>
  <ProForm.Group>
    <ProFormText
      name="nameCn"                      {/* 原 name → nameCn */}
      label="公司中文名称"
      placeholder="请输入公司中文名称"
      width="md"
      rules={[
        { required: true, message: '请输入公司中文名称' },
        { max: 200, message: '公司名称最多 200 个字符' },
      ]}
    />
    <ProFormText
      name="nameEn"
      label="公司英文名称"
      placeholder="请输入公司英文名称（可选）"
      width="md"
      rules={[{ max: 200, message: '公司英文名称最多 200 个字符' }]}
    />
    <ProFormText
      name="abbreviation"
      label="公司简称"
      placeholder="请输入公司简称（可选）"
      width="sm"
      rules={[{ max: 50, message: '公司简称最多 50 个字符' }]}
    />
    {/* 国家/地区搜索下拉（软引用 countries） */}
    <ProFormSelect
      name="countryId"
      label="国家/地区"
      placeholder="请搜索国家/地区"
      width="md"
      showSearch
      request={async (params) => {
        try {
          const res = await request.get<any, { list: Array<{ id: number; name: string; code: string }> }>(
            '/countries',
            { params: { keyword: params.keyWords, pageSize: 20 } }
          );
          return (res.list || []).map((c) => ({
            label: `${c.name} (${c.code})`,
            value: c.id,
            name: c.name,
          }));
        } catch {
          return [];
        }
      }}
      fieldProps={{
        onSelect: (_: number, option: any) => {
          // 同步写入 countryName（软引用冗余字段）
          // 需要从 form 实例调用 setFieldsValue
          // 使用 ProForm 的 formRef 或在外层 ProForm 上添加 onValuesChange
        },
      }}
    />
    {/* countryName 通过 onValuesChange 或 fieldProps.onChange 同步写入，见下方说明 */}
  </ProForm.Group>
</ProCard>

// 2. 地址信息组（新增）
<ProCard title="地址信息" bordered style={{ marginBottom: 16 }}>
  <ProForm.Group>
    <ProFormText
      name="addressCn"
      label="中文地址"
      placeholder="请输入中文地址"
      width="xl"
      rules={[{ max: 500, message: '中文地址最多 500 个字符' }]}
    />
    <ProFormText
      name="addressEn"
      label="英文地址"
      placeholder="Enter English address"
      width="xl"
      rules={[{ max: 500, message: '英文地址最多 500 个字符' }]}
    />
  </ProForm.Group>
</ProCard>

// 3. 联系信息组（新增）
<ProCard title="联系信息" bordered style={{ marginBottom: 16 }}>
  <ProForm.Group>
    <ProFormText
      name="contactPerson"
      label="联系人"
      placeholder="请输入联系人姓名"
      width="md"
      rules={[{ max: 100, message: '联系人最多 100 个字符' }]}
    />
    <ProFormText
      name="contactPhone"
      label="联系电话"
      placeholder="请输入联系电话"
      width="md"
      rules={[{ max: 50, message: '联系电话最多 50 个字符' }]}
    />
    {/* 总账会计搜索下拉（软引用 users） */}
    <ProFormSelect
      name="chiefAccountantId"
      label="总账会计"
      placeholder="请搜索用户名或姓名"
      width="md"
      showSearch
      request={async (params) => {
        try {
          const res = await request.get<any, { list: Array<{ id: string; name: string; username: string }> }>(
            '/users',
            { params: { search: params.keyWords, pageSize: 20 } }
          );
          return (res.list || []).map((u) => ({
            label: `${u.name} (${u.username})`,
            value: Number(u.id),   // users.id 是 string，需转 number
            name: u.name,
          }));
        } catch {
          return [];
        }
      }}
    />
  </ProForm.Group>
</ProCard>

// 4. 银行信息组 —— 原有字段，defaultCurrencyCode 选中时同步写 defaultCurrencyName
// 在 ProFormSelect 的 fieldProps.onChange 中同步：
<ProFormSelect
  name="defaultCurrencyCode"
  label="默认币种"
  placeholder="请选择默认币种"
  width="sm"
  request={fetchCurrencyOptions}
  fieldProps={{
    onChange: (value, option) => {
      // option 来自 fetchCurrencyOptions 返回的 {label, value, currencyName}
      // 需要在 fetchCurrencyOptions 中额外返回 currencyName 字段
      // 然后用 formRef.current?.setFieldsValue({ defaultCurrencyName: option?.currencyName })
    },
  }}
/>
```

**countryName / chiefAccountantName / defaultCurrencyName 的同步写入策略：**

由于 ProForm 中 `formRef` 可以拿到 form 实例，推荐使用 `formRef` 方式：

```tsx
const formRef = useRef<ProFormInstance>();

// ProForm 上：
<ProForm formRef={formRef} ...>

// fetchCurrencyOptions 更新，返回 currencyName 字段：
async function fetchCurrencyOptions() {
  const res = await request.get<any, { list: Array<{ code: string; name: string }> }>('/currencies');
  return (res.list || []).map((c) => ({
    label: `${c.name} (${c.code})`,
    value: c.code,
    currencyName: c.name,   // 额外传递
  }));
}

// defaultCurrencyCode 的 fieldProps.onChange：
onChange: (_: string, option: any) => {
  formRef.current?.setFieldsValue({
    defaultCurrencyName: option?.currencyName ?? null,
  });
},

// countryId 的 fieldProps.onSelect：
onSelect: (_: number, option: any) => {
  formRef.current?.setFieldsValue({
    countryName: option?.name ?? null,
  });
},

// chiefAccountantId 的 fieldProps.onSelect：
onSelect: (_: number, option: any) => {
  formRef.current?.setFieldsValue({
    chiefAccountantName: option?.name ?? null,
  });
},
```

**onFinish payload 更新（新增字段传递）：**

```typescript
onFinish={async (values) => {
  const payload: CreateCompanyPayload = {
    nameCn: values.nameCn,                              // 原 name → nameCn
    signingLocation: values.signingLocation || undefined,
    bankName: values.bankName || undefined,
    bankAccount: values.bankAccount || undefined,
    swiftCode: values.swiftCode || undefined,
    defaultCurrencyCode: values.defaultCurrencyCode || undefined,
    taxId: values.taxId || undefined,
    customsCode: values.customsCode || undefined,
    quarantineCode: values.quarantineCode || undefined,
    // 新增字段
    nameEn: values.nameEn || undefined,
    abbreviation: values.abbreviation || undefined,
    countryId: values.countryId || undefined,
    countryName: values.countryName || undefined,
    addressCn: values.addressCn || undefined,
    addressEn: values.addressEn || undefined,
    contactPerson: values.contactPerson || undefined,
    contactPhone: values.contactPhone || undefined,
    defaultCurrencyName: values.defaultCurrencyName || undefined,
    chiefAccountantId: values.chiefAccountantId || undefined,
    chiefAccountantName: values.chiefAccountantName || undefined,
  };
  // ...
}}
```

**initialValues 更新（编辑模式回填）：**

```typescript
const initialValues = detailQuery.data
  ? {
      nameCn: detailQuery.data.nameCn,                  // 原 name → nameCn
      signingLocation: detailQuery.data.signingLocation ?? undefined,
      bankName: detailQuery.data.bankName ?? undefined,
      bankAccount: detailQuery.data.bankAccount ?? undefined,
      swiftCode: detailQuery.data.swiftCode ?? undefined,
      defaultCurrencyCode: detailQuery.data.defaultCurrencyCode ?? undefined,
      taxId: detailQuery.data.taxId ?? undefined,
      customsCode: detailQuery.data.customsCode ?? undefined,
      quarantineCode: detailQuery.data.quarantineCode ?? undefined,
      // 新增字段
      nameEn: detailQuery.data.nameEn ?? undefined,
      abbreviation: detailQuery.data.abbreviation ?? undefined,
      countryId: detailQuery.data.countryId ?? undefined,
      countryName: detailQuery.data.countryName ?? undefined,
      addressCn: detailQuery.data.addressCn ?? undefined,
      addressEn: detailQuery.data.addressEn ?? undefined,
      contactPerson: detailQuery.data.contactPerson ?? undefined,
      contactPhone: detailQuery.data.contactPhone ?? undefined,
      defaultCurrencyName: detailQuery.data.defaultCurrencyName ?? undefined,
      chiefAccountantId: detailQuery.data.chiefAccountantId ?? undefined,
      chiefAccountantName: detailQuery.data.chiefAccountantName ?? undefined,
    }
  : {};
```

> **回填注意**：`countryId` 回填后 ProFormSelect 的 `showSearch` 不会自动显示 label，需要在 `request` 中判断：若 `params.keyWords` 为空且有 `initialValue`，返回当前已选项；或使用 `options` 属性覆盖。简单方案：将已有 countryName 拼接为 label，通过 `fieldProps.labelInValue` 或在 `initialValues` 中传入 `{ label: countryName, value: countryId }` 格式。
>
> **推荐方案**：`countryId` 和 `chiefAccountantId` 使用 `ProFormSelect` 的 `options` 初始值注入：
>
> ```typescript
> // 编辑模式时，额外注入已选项到 request 中
> request={async (params) => {
>   const list = await fetchCountries(params.keyWords);
>   // 如果是编辑模式且已有选项，确保其在列表中
>   if (!params.keyWords && detailQuery.data?.countryId) {
>     const alreadyIn = list.some(o => o.value === detailQuery.data.countryId);
>     if (!alreadyIn) {
>       list.unshift({ label: detailQuery.data.countryName || '', value: detailQuery.data.countryId });
>     }
>   }
>   return list;
> }}
> ```

### 前端详情页更新（detail.tsx）

```typescript
// 1. 基本信息组 columns 更新
const basicColumns: ProDescriptionsItemProps<Company>[] = [
  { title: '公司中文名称', dataIndex: 'nameCn', span: 1 },     // 原 name → nameCn
  { title: '公司英文名称', dataIndex: 'nameEn', span: 1, renderText: (v) => v || '-' },
  { title: '公司简称', dataIndex: 'abbreviation', span: 1, renderText: (v) => v || '-' },
  { title: '国家/地区', dataIndex: 'countryName', span: 1, renderText: (v) => v || '-' },
  { title: '签订地点', dataIndex: 'signingLocation', span: 1, renderText: (v) => v || '-' },
  { title: '创建时间', dataIndex: 'createdAt', span: 1, renderText: (v) => dayjs(v).format('YYYY-MM-DD') },
  { title: '更新时间', dataIndex: 'updatedAt', span: 1, renderText: (v) => dayjs(v).format('YYYY-MM-DD') },
];

// 2. 新增地址信息组
const addressColumns: ProDescriptionsItemProps<Company>[] = [
  { title: '中文地址', dataIndex: 'addressCn', span: 2, renderText: (v) => v || '-' },
  { title: '英文地址', dataIndex: 'addressEn', span: 2, renderText: (v) => v || '-' },
];

// 3. 新增联系信息组
const contactColumns: ProDescriptionsItemProps<Company>[] = [
  { title: '联系人', dataIndex: 'contactPerson', span: 1, renderText: (v) => v || '-' },
  { title: '联系电话', dataIndex: 'contactPhone', span: 1, renderText: (v) => v || '-' },
  { title: '总账会计', dataIndex: 'chiefAccountantName', span: 1, renderText: (v) => v || '-' },
];

// 4. 银行信息组 —— 新增 defaultCurrencyName 展示项
const bankColumns: ProDescriptionsItemProps<Company>[] = [
  { title: '开户行', dataIndex: 'bankName', span: 1, renderText: (v) => v || '-' },
  { title: '银行账号', dataIndex: 'bankAccount', span: 1, renderText: (v) => v || '-' },
  { title: 'SWIFT CODE', dataIndex: 'swiftCode', span: 1, renderText: (v) => v || '-' },
  { title: '默认币种代码', dataIndex: 'defaultCurrencyCode', span: 1, renderText: (v) => v || '-' },
  { title: '默认币种名称', dataIndex: 'defaultCurrencyName', span: 1, renderText: (v) => v || '-' },
];

// 5. JSX 追加两个新 ProDescriptions 块（在银行信息之前）：
<ProDescriptions<Company>
  title="地址信息"
  loading={query.isLoading}
  column={2}
  dataSource={query.data}
  columns={addressColumns}
/>

<ProDescriptions<Company>
  title="联系信息"
  loading={query.isLoading}
  column={2}
  dataSource={query.data}
  columns={contactColumns}
/>
```

### 已知文件位置（不得误建新文件）

| 文件 | 当前状态 |
|------|---------|
| `apps/api/src/modules/master-data/companies/entities/company.entity.ts` | 存在，重命名 + 追加字段 |
| `apps/api/src/modules/master-data/companies/dto/create-company.dto.ts` | 存在，重命名 + 追加字段 |
| `apps/api/src/modules/master-data/companies/dto/update-company.dto.ts` | 存在，重命名 + 追加字段 |
| `apps/api/src/modules/master-data/companies/companies.repository.ts` | 存在，更新 findByName + findAll |
| `apps/api/src/modules/master-data/companies/companies.service.ts` | 存在，更新 create/update |
| `apps/web/src/api/companies.api.ts` | 存在，重命名 + 追加类型 |
| `apps/web/src/pages/master-data/companies/index.tsx` | 存在，修改 dataIndex |
| `apps/web/src/pages/master-data/companies/form.tsx` | 存在，重命名 + 追加控件 |
| `apps/web/src/pages/master-data/companies/detail.tsx` | 存在，重命名 + 追加分组 |
| `apps/api/src/modules/master-data/companies/tests/companies.service.spec.ts` | 存在，更新测试字段名 |

### 须创建的新文件

| 文件 | 说明 |
|------|------|
| `apps/api/src/migrations/20260420001300-alter-companies-add-fields.ts` | 新建，含 up() / down() |

### 数据库与外部依赖注意事项

**软引用策略**（与 Story 2-3 中 `defaultCurrencyCode` 的软引用一致）：
- `countryId` 和 `chiefAccountantId` 不添加 FK 约束，避免迁移顺序耦合
- 名称冗余字段（`countryName` / `chiefAccountantName` / `defaultCurrencyName`）在写入时从前端同步传入，后端直接存储
- 后端 Service 层**不**做关联查询验证（id 存在性校验）— 软引用设计意图

**users.id 的类型差异**：
- `users.api.ts` 中 `User.id` 定义为 `string`（后端返回的是字符串格式的 bigint）
- Entity 和 repository 中 `id` 为 `number`（BaseEntity 使用 bigint auto）
- 前端获取用户列表后需 `Number(u.id)` 转换后存入 `chiefAccountantId`（bigint 字段，TS 层 `number`）

**currencies API 响应格式**（来自 form.tsx 实际调用）：
- 已有 `fetchCurrencyOptions` 函数，但当前直接 `request.get('/currencies')` 且期望 `{ list: [...] }`
- Story 2-2b（币种字段补全）完成后 currencies 表有 name 字段；若尚未完成，`defaultCurrencyName` 降级为空

### Story 2-3 已知问题（本 Story 继续规避）

| 序号 | 问题来源 | 正确做法 |
|------|---------|---------|
| 1 | form.tsx：currencies 用 `res.list` 但 `companies.api.ts` 其他响应用 `list` 字段 | Repository 统一返回 `list`，前端 interface 统一用 `list` |
| 2 | create-company.dto.ts 使用 `name`（与 Entity 的 `nameCn` 不一致，补丁后需同步） | 本 Story 统一重命名 |
| 3 | Review Deferred：findByName 大小写敏感 | 仍 defer，保持不变 |
| 4 | Review Deferred：无 DELETE 接口 | 仍 defer，超出范围 |

---

## 完成标准

- [ ] `company.entity.ts`：`@Unique` 引用 `nameCn`，属性 `nameCn` 含 `@Column({ name: 'name' })`，包含全部 11 个新字段（每字段均有 `@Expose()` 和 `@Column({ name })`）
- [ ] Migration `20260420001300-alter-companies-add-fields.ts` 存在，包含 `up()`（ADD COLUMN × 11）和 `down()`（DROP COLUMN × 11 逆序）
- [ ] `create-company.dto.ts` / `update-company.dto.ts`：`name` 改为 `nameCn`，包含全部新字段验证
- [ ] `companies.repository.ts`：`findByName` 参数和查询改为 `nameCn`，`findAll` 关键词搜索改为 `company.nameCn`
- [ ] `companies.service.ts`：`create` / `update` 逻辑完整覆盖所有新字段及 `nameCn` 重命名
- [ ] `companies.api.ts`：`Company` 接口 `name` → `nameCn`，包含全部新字段类型定义
- [ ] `index.tsx`：ProTable 列 `dataIndex` 更新为 `nameCn`
- [ ] `form.tsx`：5 组布局（基本/地址/联系/银行/合规），countryId/chiefAccountantId 搜索下拉可用，defaultCurrencyName 同步写入
- [ ] `detail.tsx`：7 个 ProDescriptions 块（基本/地址/联系/银行/合规），新字段正确展示
- [ ] 编辑模式可正确回填全部字段（含 countryId ProFormSelect label 回显）
- [ ] `companies.service.spec.ts` 测试：`name` → `nameCn` 全部更新，新增字段覆盖测试用例
- [ ] TypeScript 编译无报错（`pnpm --filter api build` / `pnpm --filter web build`）

---

## 分支命名

`story/2-3a-公司主体字段补全-cc补丁`

---

*Story 由 BMad Create-Story Workflow 创建 — 2026-04-20*

---

### Review Findings

> 代码审查执行于 2026-04-21，审查模式：full（3 层并行：Blind Hunter / Edge Case Hunter / Acceptance Auditor）

**Patch（需修复）：**

- [x] [Review][Patch] select 搜索下拉使用 `onSelect` 未处理清除场景，导致 countryName / chiefAccountantName 在用户清除选择时残留旧值 [`apps/web/src/pages/master-data/companies/form.tsx`] — 已修复：改为 `onChange`
- [x] [Review][Patch] 表单提交时 `countryId` 和 `chiefAccountantId` 使用 `|| undefined` 守卫，ID 为 `0` 时会被错误丢弃 [`apps/web/src/pages/master-data/companies/form.tsx` lines 165, 172] — 已修复：改为 `!= null` 守卫

**Defer（已知，暂缓）：**

- [x] [Review][Defer] `findAll` 关键词搜索仅覆盖 `nameCn`，未搜索 `nameEn` / `abbreviation` [`apps/api/src/modules/master-data/companies/companies.repository.ts`] — deferred, 本 story 约束"不改变现有逻辑"，搜索扩展为后续 story
- [x] [Review][Defer] `UpdateCompanyDto.nameCn` 缺少 `@IsNotEmpty()`，空字符串可绕过唯一性检查写入 DB [`apps/api/src/modules/master-data/companies/dto/update-company.dto.ts`] — deferred, pre-existing 模式，与其他 DTO 一致
- [x] [Review][Defer] `contactPhone` 仅有 `MaxLength(50)` 无格式校验 [`apps/api/src/modules/master-data/companies/dto/create-company.dto.ts`] — deferred, pre-existing 设计决策，与其他联系字段一致
- [x] [Review][Defer] `bigint` DB 列（country_id / chief_accountant_id）TypeScript 层类型为 `number`，超大 ID 存在精度风险 [`apps/api/src/modules/master-data/companies/entities/company.entity.ts`] — deferred, pre-existing 项目级模式，实际 ID 范围不超过安全整数上限

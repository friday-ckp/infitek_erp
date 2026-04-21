# Sprint Change Proposal
**项目：** infitek_erp
**日期：** 2026-04-20
**提案人：** Correct Course Agent
**审阅人：** friday

---

## 第 1 节：问题摘要

### 问题陈述

Epic 2 全部 Story（2-1 至 2-4）及 Epic 3 Story 3-1 在实现过程中，开发 Agent 未参照 `docs/系统模块对应字段清单.md` 中各 OA 表单的完整字段定义，仅依据 PRD 功能描述（FR13-FR17、FR01）进行字段设计，导致各模块 Entity / Migration / 前端表单均缺失大量业务字段。

### 发现时间

代码审查阶段（Epic 2 Retrospective 后，Epic 3 Story 3-1 完成后）。

### 影响范围

缺失字段会直接影响后续模块对这些主数据的完整引用，具体包括：
- 仓库字段缺失 → 入库单、出库单无法完整关联仓库信息
- 公司主体字段缺失 → 采购订单、物流单的签约主体信息不完整
- 产品分类字段缺失 → SPU/SKU 管理无法关联采购/产品负责人

---

## 第 2 节：影响分析

### Epic 影响

| Epic | 影响 | 处理方式 |
|------|------|---------|
| Epic 2（已完成） | 5 个模块字段缺失 | 为各受影响模块创建字段补丁 Story |
| Epic 3（进行中） | Story 3-1 字段缺失 | 在 Story 3-1 内直接补充（尚未正式关闭） |
| Epic 4-8（未开始） | 无直接影响 | 强制要求所有后续 Story 创建时对照字段清单 |

### Story 影响

- **需要补丁的已完成 Story：** 2-2（仓库、币种、国家）、2-3（公司主体）
- **需要在当前 Story 内补充：** 3-1（产品分类）
- **不受影响：** 2-1（单位，`描述` 字段用户决定跳过）、2-4（横切能力，无 Entity）

### 技术影响

- 每个受影响模块需新建 Migration（ALTER TABLE ADD COLUMN，向后兼容）
- 无需回滚已有数据，所有新增列均可为 NULL 或有安全默认值
- 需在 `packages/shared/src/enums/` 新增枚举：WarehouseType、WarehouseOwnership
- 公司主体 Entity 属性 `name` 需重命名为 `nameCn`（DB 列名保持 `name` 不变）

---

## 第 3 节：推荐方案

**选择：方案一 — 直接调整（Direct Adjustment）**

**理由：**
1. 增列 Migration 风险极低，完全向后兼容，不影响已有数据和逻辑
2. 无需回滚任何已完成工作
3. 可立即进入实施，不影响 Epic 3 后续 Story（3-2 SPU）的并行推进
4. 每个补丁 Story 独立可测，风险隔离

**工作量估算：** 中等（5 个补丁 Story + 1 个 Story 内补充）
**风险等级：** 低

---

## 第 4 节：详细变更提案

### 提案 #2：仓库管理字段补充（Story 2-2 补丁）

**变更类型：** 字段追加（8 个字段）

#### 后端

**Entity 新增字段（`warehouse.entity.ts`）：**

```typescript
@Column({ name: 'warehouse_code', type: 'varchar', length: 50, nullable: true })
@Expose()
warehouseCode: string | null;

@Column({ name: 'warehouse_type', type: 'enum', enum: ['自营仓', '港口仓', '工厂仓'], nullable: true })
@Expose()
warehouseType: string | null;

@Column({ name: 'supplier_id', type: 'bigint', nullable: true })
@Expose()
supplierId: number | null;

@Column({ name: 'supplier_name', type: 'varchar', length: 200, nullable: true })
@Expose()
supplierName: string | null;

@Column({ name: 'default_ship_province', type: 'varchar', length: 50, nullable: true })
@Expose()
defaultShipProvince: string | null;

@Column({ name: 'default_ship_city', type: 'varchar', length: 50, nullable: true })
@Expose()
defaultShipCity: string | null;

@Column({ name: 'ownership', type: 'enum', enum: ['内部仓', '外部仓'], default: '内部仓' })
@Expose()
ownership: string;

@Column({ name: 'is_virtual', type: 'tinyint', default: 0 })
@Expose()
isVirtual: number;
```

**新增枚举（`packages/shared/src/enums/`）：**

```typescript
// warehouse-type.enum.ts
export enum WarehouseType {
  SELF_OWNED = '自营仓',
  PORT = '港口仓',
  FACTORY = '工厂仓',
}

// warehouse-ownership.enum.ts
export enum WarehouseOwnership {
  INTERNAL = '内部仓',
  EXTERNAL = '外部仓',
}
```

**Migration（新建文件）：**

```typescript
// 20260420001000-alter-warehouses-add-fields.ts
ALTER TABLE `warehouses`
  ADD COLUMN `warehouse_code`        varchar(50)              NULL COMMENT '仓库编号',
  ADD COLUMN `warehouse_type`        enum('自营仓','港口仓','工厂仓') NULL COMMENT '仓库类型',
  ADD COLUMN `supplier_id`           bigint                   NULL COMMENT '关联采购供应商ID（软引用）',
  ADD COLUMN `supplier_name`         varchar(200)             NULL COMMENT '关联采购供应商名称',
  ADD COLUMN `default_ship_province` varchar(50)              NULL COMMENT '默认发运省份',
  ADD COLUMN `default_ship_city`     varchar(50)              NULL COMMENT '默认发运城市',
  ADD COLUMN `ownership`             enum('内部仓','外部仓') NOT NULL DEFAULT '内部仓' COMMENT '仓库归属',
  ADD COLUMN `is_virtual`            tinyint(1)               NOT NULL DEFAULT 0 COMMENT '是否虚拟仓';
```

**DTO 更新：**
- `create-warehouse.dto.ts` / `update-warehouse.dto.ts`：新增上述字段的验证规则

#### 前端

**`form.tsx` 新增字段：**
- `warehouseType`：ProFormSelect（枚举下拉：自营仓/港口仓/工厂仓）
- `supplierId` + `supplierName`：EntitySearchSelect（搜索采购供应商，Epic 4 完成前暂 disabled）
- `defaultShipProvince` + `defaultShipCity`：antd Cascader 省市二级联动（静态 JSON 数据）
- `ownership`：ProFormSelect（内部仓/外部仓）
- `isVirtual`：ProFormSwitch

**`detail.tsx`：** 新增上述字段展示项

---

### 提案 #3：币种信息字段补充（Story 2-2 补丁）

**变更类型：** 字段追加（2 个字段）

#### 后端

**Entity 新增字段（`currency.entity.ts`）：**

```typescript
@Column({ name: 'symbol', type: 'varchar', length: 10, nullable: true })
@Expose()
symbol: string | null;

@Column({ name: 'is_base_currency', type: 'tinyint', default: 0 })
@Expose()
isBaseCurrency: number;
```

**Migration（新建文件）：**

```typescript
// 20260420001100-alter-currencies-add-fields.ts
ALTER TABLE `currencies`
  ADD COLUMN `symbol`           varchar(10) NULL COMMENT '币种符号（如 $、¥）',
  ADD COLUMN `is_base_currency` tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否本位币';
```

**Service 层新增业务约束：**

```typescript
// 设置本位币时，先清除其他记录的 is_base_currency = 0
async setBaseCurrency(id: number): Promise<void> {
  await this.repo.update({}, { isBaseCurrency: 0 });
  await this.repo.update(id, { isBaseCurrency: 1 });
}
// 在 create/update 时，若 isBaseCurrency = 1，调用此方法
```

#### 前端

**`form.tsx` 新增字段：**
- `symbol`：ProFormText（可选，maxLength: 10）
- `isBaseCurrency`：ProFormSwitch（tooltip：同一时间只能有一种本位币）

**`index.tsx`：** 列表增加"本位币"Tag 标识列（蓝色 processing Tag）

---

### 提案 #4：国家/地区字段补充（Story 2-2 补丁）

**变更类型：** 字段追加（2 个字段）

#### 后端

**Entity 新增字段（`country.entity.ts`）：**

```typescript
@Column({ name: 'name_en', type: 'varchar', length: 100, nullable: true })
@Expose()
nameEn: string | null;

@Column({ name: 'abbreviation', type: 'varchar', length: 20, nullable: true })
@Expose()
abbreviation: string | null;
```

**Migration（新建文件）：**

```typescript
// 20260420001200-alter-countries-add-fields.ts
ALTER TABLE `countries`
  ADD COLUMN `name_en`      varchar(100) NULL COMMENT '国家/地区英文名称',
  ADD COLUMN `abbreviation` varchar(20)  NULL COMMENT '国家/地区简称';
```

#### 前端

**`form.tsx` 新增字段：**
- `nameEn`：ProFormText（可选，maxLength: 100）
- `abbreviation`：ProFormText（可选，maxLength: 20）

**`detail.tsx`：** 新增展示项

---

### 提案 #5：公司主体字段补充（Story 2-3 补丁）

**变更类型：** 字段追加（11 个字段）+ Entity 属性重命名

#### 后端

**Entity 变更（`company.entity.ts`）：**

```typescript
// 属性重命名（DB 列名保持 `name` 不变）
@Column({ name: 'name', type: 'varchar', length: 200 })
@Expose()
nameCn: string;  // 原来的 name 改为 nameCn

// 新增字段
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
```

**Migration（新建文件）：**

```typescript
// 20260420001300-alter-companies-add-fields.ts
ALTER TABLE `companies`
  ADD COLUMN `name_en`                varchar(200) NULL COMMENT '公司英文名称',
  ADD COLUMN `abbreviation`           varchar(50)  NULL COMMENT '公司简称',
  ADD COLUMN `country_id`             bigint       NULL COMMENT '国家/地区ID（软引用）',
  ADD COLUMN `country_name`           varchar(100) NULL COMMENT '国家/地区名称',
  ADD COLUMN `address_cn`             varchar(500) NULL COMMENT '中文地址',
  ADD COLUMN `address_en`             varchar(500) NULL COMMENT '英文地址',
  ADD COLUMN `contact_person`         varchar(100) NULL COMMENT '联系人',
  ADD COLUMN `contact_phone`          varchar(50)  NULL COMMENT '联系电话',
  ADD COLUMN `default_currency_name`  varchar(50)  NULL COMMENT '默认币种名称',
  ADD COLUMN `chief_accountant_id`    bigint       NULL COMMENT '总账会计用户ID',
  ADD COLUMN `chief_accountant_name`  varchar(100) NULL COMMENT '总账会计姓名';
```

**注意：** `@Unique('idx_companies_name', ['nameCn'])` 需同步更新（属性名改变，装饰器引用需跟随）。

#### 前端

**`companies.api.ts` 更新：** `name` 字段改为 `nameCn`，新增全部字段定义

**`form.tsx` 调整分组：**

| 分组 | 字段 |
|------|------|
| 基本信息 | 公司中文名称(nameCn)、公司英文名称(nameEn)、公司简称(abbreviation)、国家/地区(EntitySearchSelect) |
| 地址信息（新增） | 中文地址(addressCn)、英文地址(addressEn) |
| 联系信息（新增） | 联系人(contactPerson)、联系电话(contactPhone)、总账会计(EntitySearchSelect → users) |
| 银行信息 | 原有字段 + 默认币种选中时同时写入 defaultCurrencyName |
| 合规信息 | 原有字段不变 |

---

### 提案 #6：产品分类字段补充（Story 3-1 内补充）

**变更类型：** 字段追加（6 个字段）+ categoryCode 自动生成逻辑

#### 后端

**Entity 新增字段（`product-category.entity.ts`）：**

```typescript
@Column({ name: 'name_en', type: 'varchar', length: 100, nullable: true })
@Expose()
nameEn: string | null;

@Column({ name: 'category_code', type: 'varchar', length: 20, nullable: true, unique: true })
@Expose()
categoryCode: string | null;

@Column({ name: 'procurement_owner_id', type: 'bigint', nullable: true })
@Expose()
procurementOwnerId: number | null;

@Column({ name: 'procurement_owner', type: 'varchar', length: 100, nullable: true })
@Expose()
procurementOwner: string | null;

@Column({ name: 'product_owner_id', type: 'bigint', nullable: true })
@Expose()
productOwnerId: number | null;

@Column({ name: 'product_owner', type: 'varchar', length: 100, nullable: true })
@Expose()
productOwner: string | null;
```

**Migration（新建文件）：**

```typescript
// 20260420001400-alter-product-categories-add-fields.ts
ALTER TABLE `product_categories`
  ADD COLUMN `name_en`              varchar(100) NULL    COMMENT '分类名称(EN)',
  ADD COLUMN `category_code`        varchar(20)  NULL    COMMENT '分类编号（系统生成，格式CPDL0001）',
  ADD COLUMN `procurement_owner_id` bigint       NULL    COMMENT '采购负责人用户ID',
  ADD COLUMN `procurement_owner`    varchar(100) NULL    COMMENT '采购负责人姓名',
  ADD COLUMN `product_owner_id`     bigint       NULL    COMMENT '产品负责人用户ID',
  ADD COLUMN `product_owner`        varchar(100) NULL    COMMENT '产品负责人姓名',
  ADD UNIQUE KEY `idx_product_categories_category_code` (`category_code`);
```

**Service 新增 categoryCode 自动生成：**

```typescript
private async generateCategoryCode(): Promise<string> {
  const latest = await this.repo.findOne({
    where: { categoryCode: Not(IsNull()) },
    order: { categoryCode: 'DESC' },
  });
  const seq = latest
    ? parseInt(latest.categoryCode!.replace('CPDL', ''), 10) + 1
    : 1;
  return `CPDL${String(seq).padStart(4, '0')}`;
}
// create() 中：dto.categoryCode = await this.generateCategoryCode();
// categoryCode 禁止由前端传入，DTO 不包含此字段
```

#### 前端

**`form.tsx` 新增字段：**
- `nameEn`：ProFormText（可选）
- `procurementOwnerId` + `procurementOwner`：EntitySearchSelect（搜索 users）
- `productOwnerId` + `productOwner`：EntitySearchSelect（搜索 users）
- `categoryCode` 不在表单中（系统生成）

**右侧详情面板：** 新增 categoryCode（只读展示）、nameEn、采购负责人、产品负责人

---

## 第 5 节：实施交接

### 变更规模分类：**Moderate（中等）**

涉及 5 个模块的字段扩展，需要 Story 文件更新 + Migration + Entity + DTO + 前端三页，属于跨多文件的系统性修改，建议由 Developer Agent 逐 Story 实施。

### 实施计划

| 优先级 | 任务 | 类型 | 负责角色 |
|--------|------|------|---------|
| P0 | Story 3-1 字段补充（分类管理） | 当前 Story 内实施 | Developer Agent |
| P1 | Story 2-2 仓库字段补丁 | 新建补丁 Story | Developer Agent |
| P1 | Story 2-2 币种字段补丁 | 新建补丁 Story | Developer Agent |
| P1 | Story 2-2 国家字段补丁 | 新建补丁 Story | Developer Agent |
| P1 | Story 2-3 公司主体字段补丁 | 新建补丁 Story | Developer Agent |
| P2 | 后续所有 Story 创建时强制对照字段清单 | 流程规范 | PM/Create-Story Agent |

### 成功标准

- [ ] 所有受影响模块的 Entity 字段与字段清单对齐
- [ ] 所有 Migration 文件创建（ALTER TABLE，含 up() 和 down()）
- [ ] 前端表单和详情页同步展示新增字段
- [ ] 新增枚举在 `packages/shared` 中定义并导出
- [ ] 全量单元测试通过
- [ ] TypeScript 编译无报错

### 流程规范改进（防止复发）

> 所有后续 Story（从 Epic 3 Story 3-2 起）在 Create-Story 阶段必须：
> 1. 查阅 `docs/系统模块对应字段清单.md` 对应模块字段
> 2. 将字段清单中的字段逐一映射到 Entity 设计中
> 3. Story 的"Dev Agent Context"部分必须包含完整字段对照表

---

*Sprint Change Proposal 由 BMAD Correct Course Agent 生成 — 2026-04-20*

# Story 3.3: SKU 变体管理（含 HS 码与报关信息）

Status: done

## Story

As a 产品专员,
I want 在 SPU 下创建和管理多个 SKU 变体，完整记录规格、重量、体积、HS 码、报关品名（中英文）和申报价值参考,
So that 商务和报关人员可以搜索 SKU 编号后一屏获取所有报关所需信息，不再问人或翻 Excel。

---

## Acceptance Criteria

**Given** 产品专员在 SPU 详情页查看 SKU 列表
**When** 页面加载完成
**Then** 展示该 SPU 下所有 SKU 变体列表，含列：SKU 编码、规格摘要、HS 码、重量、体积
**And** 支持关键字搜索和分页

**Given** 产品专员点击"新建 SKU"
**When** 进入 SKU 创建表单
**Then** 表单包含：规格描述（必填）、重量 kg（必填）、体积 CBM（必填）、HS 码（必填，8-10 位数字）、报关品名中文（必填）、报关品名英文（必填）、申报价值参考、单位（关联单位主数据）
**And** 所属 SPU 自动关联（从 SPU 详情页进入时自动填充，灰色底不可编辑，UX-DR29）

**Given** 产品专员填写 HS 码
**When** 输入"9405429000"（10 位数字）
**Then** 表单校验通过
**When** 输入"ABC123"（非纯数字）
**Then** 内联校验提示"HS 码必须为 8-10 位数字"

**Given** 任意用户搜索 SKU 编码进入 SKU 详情页
**When** 页面加载完成
**Then** 一屏展示所有关键信息（UX-DR28）：规格、重量、体积、HS 码、报关品名中英文、申报价值、所属 SPU/分类路径
**And** 详情页 ProDescriptions 按分组卡片展示（基本信息卡 + 报关信息卡）

**Given** 后端 SKU 全局列表 API
**When** 授权用户访问 SKU 列表
**Then** 支持按 SKU 编码/名称关键字搜索、分页加载
**And** 列表含 SPU 名称列，方便定位

**Given** 后端 SKU 实体设计
**When** 查看字段
**Then** 包含 id、sku_code（自动生成 SKU001 格式）、spu_id（外键）、specification（必填）、weight_kg（必填）、volume_cbm（必填）、hs_code（必填）、customs_name_cn（必填）、customs_name_en（必填）、declared_value_ref、unit_id（外键）、status（上架/下架可售/下架不可售/临拓）、以及扩展字段（产品类型、产品型号、分类冗余、包装信息、图片等）、created_at、updated_at、created_by、updated_by

---

## Tasks / Subtasks

### 后端：skus 模块

- [x] 创建 Entity `apps/api/src/modules/master-data/skus/entities/sku.entity.ts`
- [x] 创建 DTO：`create-sku.dto.ts`、`update-sku.dto.ts`、`query-sku.dto.ts`
- [x] 创建 Repository `skus.repository.ts`（含 findAll、findById、generateCode、create、update、delete）
- [x] 创建 Service `skus.service.ts`（含 CRUD、SPU 存在性校验、code 自动生成）
- [x] 创建 Controller `skus.controller.ts`（标准 CRUD 5 个端点）
- [x] 创建 Module `skus.module.ts`（import SpusModule，export SkusService）
- [x] 创建 Migration `20260422000200-create-skus-table.ts`
- [x] 创建 Migration `20260423000100-sku-add-fields.ts`（CC 补丁：product_model、accessory_parent_sku_id、category_level1/2/3_id、packaging_list、product_image_urls）
- [x] 注册 SkusModule 到 `apps/api/src/app.module.ts`
- [x] 创建 Service 单元测试 `tests/skus.service.spec.ts`

### 前端：skus 页面

- [x] 创建 API 层 `apps/web/src/api/skus.api.ts`
- [x] 创建列表页 `apps/web/src/pages/master-data/skus/index.tsx`（ProTable + SearchForm + useDebounce）
- [x] 创建详情页 `apps/web/src/pages/master-data/skus/detail.tsx`（ProDescriptions 分组卡片）
- [x] 创建表单页 `apps/web/src/pages/master-data/skus/form.tsx`（AnchorNav + SectionCard 多分组，含图片上传）
- [x] 在 `apps/web/src/App.tsx` 注册路由

---

## Dev Agent Context

### 与 Story 3.2（SPU）的关键差异

| 维度 | Story 3.2 SPU | Story 3.3 SKU |
|------|--------------|---------------|
| 字段数量 | ~20 | ~40+（字段远多于 SPU） |
| 表单结构 | ProForm 单卡片分组 | AnchorNav + SectionCard 多分组锚点导航 |
| 图片 | 无 | 有，OSS 上传（uploadSkuImage） |
| 状态字段 | 无 | 有（上架/下架可售/下架不可售/临拓） |
| 包装信息 | 无 | 有，ProFormList 动态行（packagingList） |
| 分类冗余 | category_id + level1/2 | category_level1/2/3_id（冗余存储） |
| 配件关联 | 无 | accessory_parent_sku_id（自关联） |

### 关键实现细节

**后端 Entity 字段分组（实际实现）：**
- 产品基本：name_cn、name_en、specification、status、product_type、product_model、accessory_parent_sku_id、category_level1/2/3_id、principle、product_usage、core_params、electrical_params、material、has_plug、special_attributes、special_attributes_note、customer_warranty_months、forbidden_countries
- 重量体积：weight_kg（必填）、gross_weight_kg、length_cm、width_cm、height_cm、volume_cbm（必填）
- 包装：packaging_type、packaging_qty、packaging_info、packaging_list（JSON 文本，动态行）
- 报关：hs_code（必填）、customs_name_cn（必填）、customs_name_en（必填）、declared_value_ref、declaration_elements、is_inspection_required、regulatory_conditions、tax_refund_rate、customs_info_maintained
- 图片：product_image_url、product_image_urls（JSON 文本，多图）

**SKU 编码自动生成：**
- 格式：`SKU001`（SKU + 3 位序号）
- 逻辑：`SELECT MAX(sku_code) WHERE sku_code LIKE 'SKU%'`，数字排序取最大值 +1
- 重复时数据库 unique 约束报错，Service 捕获 `ER_DUP_ENTRY` 返回 `ConflictException`

**前端表单分组（AnchorNav）：**
- 基本信息（SPU 关联、规格、状态、产品类型等）
- 产品参数（原理、用途、核心参数、电气参数、材质等）
- 重量体积（净重、毛重、长宽高、体积）
- 包装信息（包装类型、装箱数量、ProFormList 动态行）
- 报关信息（HS 码、报关品名中英文、申报价值等）
- 图片（Upload 多图上传，OSS）

**SkuStatus 枚举（packages/shared）：**
```typescript
export enum SkuStatus {
  ON_SHELF = '上架',
  OFF_SHELF_SALEABLE = '下架可售',
  OFF_SHELF_NOT_SALEABLE = '下架不可售',
  TEMP_EXPAND = '临拓',
}
```

**CC 补丁（20260423000100）触发原因：**
- 初始 migration 缺少 product_model、accessory_parent_sku_id、category_level1/2/3_id、packaging_list、product_image_urls 字段
- 通过 Correct Course 补丁 migration 追加，无需重建表

### 避坑指南（必读）

1. **SkusModule 必须 export SkusService**：证书模块（3-5）和资料库模块（3-6）均需注入 SkusService 做存在性校验，未 export 会导致依赖注入失败

2. **packaging_list 是 JSON 字符串**：前端 ProFormList 的动态行数据需 `JSON.stringify` 后存入 text 列，读取时 `JSON.parse`；空数组存 null

3. **product_image_urls 是 JSON 字符串**：多图 URL 数组同样序列化为 text 列

4. **HS 码校验**：DTO 层用 `@Matches(/^\d{8,10}$/)` 校验，前端用 `pattern: /^\d{8,10}$/` 规则

5. **accessory_parent_sku_id 自关联**：当前无级联查询，仅存储 ID，前端展示时需额外查询父 SKU 名称

6. **status 默认值变更**：初始 migration 默认值为 `'active'`（英文），CC 补丁改为 `'上架'`（中文），与 SkuStatus 枚举对齐

7. **图片上传使用独立接口**：`uploadSkuImage` 调用 `POST /api/v1/skus/upload-image`，返回 OSS URL，与证书/资料库的两步式上传（先上传获取 key）不同——SKU 图片直接返回 URL

8. **列表页 spuId 过滤**：从 SPU 详情页进入时 URL 携带 `?spuId=xxx`，列表页读取 searchParams 过滤，不展示全局 SKU

### 关键文件路径

| 文件 | 路径 |
|------|------|
| Entity | `apps/api/src/modules/master-data/skus/entities/sku.entity.ts` |
| Service | `apps/api/src/modules/master-data/skus/skus.service.ts` |
| Repository | `apps/api/src/modules/master-data/skus/skus.repository.ts` |
| Controller | `apps/api/src/modules/master-data/skus/skus.controller.ts` |
| Module | `apps/api/src/modules/master-data/skus/skus.module.ts` |
| Migration 1 | `apps/api/src/migrations/20260422000200-create-skus-table.ts` |
| Migration 2 | `apps/api/src/migrations/20260423000100-sku-add-fields.ts` |
| Service Spec | `apps/api/src/modules/master-data/skus/tests/skus.service.spec.ts` |
| API 层 | `apps/web/src/api/skus.api.ts` |
| 列表页 | `apps/web/src/pages/master-data/skus/index.tsx` |
| 详情页 | `apps/web/src/pages/master-data/skus/detail.tsx` |
| 表单页 | `apps/web/src/pages/master-data/skus/form.tsx` |

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes

- 后端严格按照 7 文件模块标准实现（entity/dto×3/repository/service/controller/module）
- SKU 字段远多于其他模块（~40 字段），表单采用 AnchorNav + SectionCard 多分组锚点导航
- CC 补丁（20260423000100）追加了 product_model、accessory_parent_sku_id、category_level1/2/3_id、packaging_list、product_image_urls 字段，并修正 status 默认值为中文
- SkuStatus 枚举定义在 packages/shared，前后端共用
- Service 单元测试 9/9 全部通过，覆盖创建/更新/删除的正常和异常路径
- 后端/前端 TypeScript 编译均无错误

### File List

**新建文件（后端）：**
- `apps/api/src/modules/master-data/skus/entities/sku.entity.ts`
- `apps/api/src/modules/master-data/skus/dto/create-sku.dto.ts`
- `apps/api/src/modules/master-data/skus/dto/update-sku.dto.ts`
- `apps/api/src/modules/master-data/skus/dto/query-sku.dto.ts`
- `apps/api/src/modules/master-data/skus/skus.repository.ts`
- `apps/api/src/modules/master-data/skus/skus.service.ts`
- `apps/api/src/modules/master-data/skus/skus.controller.ts`
- `apps/api/src/modules/master-data/skus/skus.module.ts`
- `apps/api/src/migrations/20260422000200-create-skus-table.ts`
- `apps/api/src/migrations/20260423000100-sku-add-fields.ts`（CC 补丁）
- `apps/api/src/modules/master-data/skus/tests/skus.service.spec.ts`
- `packages/shared/src/enums/sku-status.enum.ts`

**新建文件（前端）：**
- `apps/web/src/api/skus.api.ts`
- `apps/web/src/pages/master-data/skus/index.tsx`
- `apps/web/src/pages/master-data/skus/detail.tsx`
- `apps/web/src/pages/master-data/skus/form.tsx`

**修改文件：**
- `apps/api/src/app.module.ts`（注册 SkusModule）
- `apps/web/src/App.tsx`（注册路由）
- `packages/shared/src/index.ts`（导出 SkuStatus）
- `apps/api/src/__mocks__/infitek-shared.ts`（添加 SkuStatus mock）

---

## Change Log

- 2026-04-22：创建 Story 3.3，完成 SKU 变体管理后端模块与前端页面
- 2026-04-23：CC 补丁追加扩展字段（product_model、分类冗余、packaging_list、product_image_urls），修正 status 默认值
- 2026-04-25：补充 story 文件（原文件缺失，从代码逆向还原）

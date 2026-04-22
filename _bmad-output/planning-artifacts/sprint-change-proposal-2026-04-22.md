# Sprint Change Proposal — SPU 分类编号字段补全

**日期**：2026-04-22
**变更类型**：Minor（CC 补丁，直接由 Dev Agent 执行）
**关联 Story**：Story 3-2（SPU 基础信息管理）
**状态**：已实施

---

## Section 1: Issue Summary

**问题描述**

Story 3-2 开发过程中未参考 `docs/系统模块对应字段清单.md` 中 SPU信息管理模块的完整字段清单，导致以下 3 个字段遗漏实现：

- `一级分类编号`（category_level1_code）
- `二级分类编号`（category_level2_code）
- `三级分类编号`（category_level3_code）

**发现时机**：Story 3-2 开发完成后，代码 Review 阶段对照字段清单时发现。

**字段作用**：这 3 个字段是分类 `code` 的冗余存储，OA 系统和下游模块（采购、销售、物流）在产品明细中均通过分类编号关联数据，是跨模块数据同步的关键字段。

---

## Section 2: Impact Analysis

**字段清单来源**

`docs/系统模块对应字段清单.md` → SPU信息管理 字段 22-24（去除 SPUID，该字段由用户确认不实现）：

| # | 字段 | DB 列 | 类型 | 说明 |
|---|------|-------|------|------|
| 22 | 一级分类编号 | category_level1_code | varchar(20) nullable | 从分类树推导 |
| 24 | 二级分类编号 | category_level2_code | varchar(20) nullable | 从分类树推导 |
| 25 | 三级分类编号 | category_level3_code | varchar(20) nullable | 选中分类自身的 code |

> 字段 18-21（sku列表/文件资料/证书资料/FAQ）已在 Story 3-3 ～ 3-6 中规划，本次不涉及。
> 字段 23（SPUID）经用户确认不实现，已从本次 CC 范围移除。

**影响评估**

| 层次 | 影响 |
|------|------|
| 数据库 | ALTER TABLE spus 增 3 列，全 nullable，存量数据无影响 |
| 后端 Entity | 新增 3 个 @Column 字段 |
| 后端 Service | create/update 方法中补充分类树 code 推导逻辑 |
| 后端 Migration | 新增独立 ALTER migration 文件 |
| 前端 API 类型 | Spu interface 新增 3 个字段 |
| 前端详情页 | 基础信息分组新增 3 个展示项 |
| 其他 Story | 不影响 3-3 ～ 3-6 |

---

## Section 3: Recommended Approach

**方案**：Direct Adjustment（直接补全字段，新建 Migration ALTER TABLE）

不回滚 Story 3-2，直接通过 CC 补丁方式追加字段。code 字段在 `create`/`update` 时由 Service 自动从分类树推导，前端表单无需新增输入项（只读展示）。

---

## Section 4: Detailed Change Proposals

### 变更 1 — Entity

**文件**：`apps/api/src/modules/master-data/spus/entities/spu.entity.ts`

在 `companyId` 列之后新增：
```typescript
categoryLevel1Code: string | null  // category_level1_code varchar(20)
categoryLevel2Code: string | null  // category_level2_code varchar(20)
categoryLevel3Code: string | null  // category_level3_code varchar(20)
```

### 变更 2 — Migration

**新建文件**：`apps/api/src/migrations/20260422000100-spu-add-category-codes.ts`

ALTER TABLE spus 增加 3 列（全 nullable，down 方法可回滚）。

### 变更 3 — Service

**文件**：`apps/api/src/modules/master-data/spus/spus.service.ts`

`create` 方法：在解析 level1/level2 ID 时，同步读取 `.code` 字段赋值给 `categoryLevel1Code`/`categoryLevel2Code`；三级分类（选中分类）的 code 直接读取 `category.code`。

`update` 方法：categoryId 发生变更时，同步更新 3 个 code 字段；未变更时保持原值。

### 变更 4 — 前端 API 类型

**文件**：`apps/web/src/api/spus.api.ts`

`Spu` interface 在 `companyId` 之后新增：
```typescript
categoryLevel1Code: string | null;
categoryLevel2Code: string | null;
categoryLevel3Code: string | null;
```

### 变更 5 — 前端详情页

**文件**：`apps/web/src/pages/master-data/spus/detail.tsx`

`basicColumns` 数组新增 3 个 ProDescriptions 项（只读展示，`renderText: (v) => v || '-'`）。

---

## Section 5: Implementation Handoff

**变更范围**：Minor — 已由 Dev Agent 直接实施

**实施状态**：已完成

**已修改文件清单**：

| 文件 | 操作 |
|------|------|
| `apps/api/src/modules/master-data/spus/entities/spu.entity.ts` | 修改（+3列） |
| `apps/api/src/migrations/20260422000100-spu-add-category-codes.ts` | 新建 |
| `apps/api/src/modules/master-data/spus/spus.service.ts` | 修改（推导逻辑） |
| `apps/web/src/api/spus.api.ts` | 修改（+3字段） |
| `apps/web/src/pages/master-data/spus/detail.tsx` | 修改（展示） |
| `_bmad-output/implementation-artifacts/3-2-spu基础信息管理.md` | 更新（同步规范） |

**后续验证清单**：

- [ ] 运行 `pnpm migration:run` 确认 ALTER 成功
- [ ] 新建 SPU 后查看 category_level1/2/3_code 已正确写入
- [ ] 更新 SPU 分类后确认 code 字段同步更新
- [ ] 前端详情页正确展示三个分类编号
- [ ] 后端/前端 TypeScript 编译无错误

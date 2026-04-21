# Deferred Work

## Deferred from: code review of 2-2a-仓库字段补全-cc补丁 (2026-04-20)

- `@IsEnum(Object.values(...))` 应传枚举对象而非数组：项目中 WarehouseStatus / WarehouseType / WarehouseOwnership 等枚举均使用此模式，需统一修复
- `supplierId` Entity 声明 `number` 但 DB 列为 `bigint`（TypeORM 默认返回 string）：与 `supplier_id` 相关的字段存在精度隐患，待供应商模块（Epic 4）开发时一并处理

## Deferred from: code review of 2-3-公司主体信息管理 (2026-04-20)

- TOCTOU 竞态：create/update 中的名称唯一性检查与写入非原子操作 — 需数据库事务保障，超出本 Story 范围
- update 方法直接将 dto spread 传入 repository，无白名单过滤 — DTO 类型已约束字段范围，当前可接受
- findByName 大小写敏感，与 DB 排序规则存在差异 — DB 唯一约束保障正确性，应用层 400 为尽力而为
- 无 DELETE 接口，公司主体无法删除 — 本 Story 未要求删除功能
- normalizeApiError 对非对象类型错误仅返回通用消息 — 项目中原始类型错误极少见
- PATCH 允许空 body（UpdateCompanyDto 全字段可选）— 空更新是幂等无害操作
- update 在 findById 与 repo.update 之间存在并发删除的极端情况 — 极低概率，超出本 Story 范围
- 货币下拉 Silent 降级为 []，用户无法感知加载失败 — 设计意图，spec 明确要求优雅降级
- 创建成功后跳转详情页存在短暂 loading 状态 — React Query 自动重取，体验可接受
- pageSize 切换无 debounce 可能触发多个并行请求 — 超出本 Story 范围
- hasFilters 仅基于 keyword，未考虑未来新增筛选项 — 本 Story 无其他筛选条件
- 编辑表单加载的是快照数据，无并发冲突检测 — 无乐观锁需求，超出本 Story 范围
- 货币选项直接在 form.tsx 内调用 request，未经 companies.api.ts — 货币数据属跨模块依赖，request 包装器已使用，spirit 满足

## Deferred from: code review of 2-2c-国家字段补全-cc补丁 (2026-04-20)

- `UpdateCountryPayload.nameEn/abbreviation` 类型为 `string?` 而非 `string | null`，无法通过 payload 显式清空字段 — 清空功能超出本 Story 范围，如需支持清空应在后续 Story 中统一处理
- Migration `down()` 缺少 `IF EXISTS` 保护，在全新未执行 `up()` 的环境上执行 `down()` 会报错 — 符合项目现有 Migration 编写惯例，不影响正常部署流程

## Deferred from: code review of 2-4-搜索筛选与分页横切能力 (2026-04-20)

- `PaginatedResponse<T>` 与 `PaginationResult<T>` 重复：前者新增 totalPages 字段，应在后续重构中整合为单一标准类型并迁移消费方。
- 折叠按钮文字"展开高级筛选"/"收起高级筛选"偏离 UX 规范"高级筛选"/"收起"，功能正确，仅文字风格差异，需与 UX 团队确认最终措辞。
- `applyKeywordFilter` alias/fields 直接插值入 SQL（当前均为开发者硬编码，不是用户输入）。若将来开放动态字段选择，需改为白名单校验。
- `applyKeywordFilter` 参数名 kw0/kw1 若在同一 QB 多次调用会冲突，建议未来版本引入调用计数器或前缀避免冲突。
- `onClearAll` prop 为 undefined 时不显示"清除全部"；UX 规范要求仅由 activeTags.length>0 控制，建议后续使用时始终传入回调或改为 required prop。

## Deferred from: code review of 2-3a-公司主体字段补全-cc补丁 (2026-04-21)

- `findAll` 关键词搜索仅覆盖 `nameCn`，未搜索 `nameEn` / `abbreviation`（`companies.repository.ts`）— 搜索范围扩展留待后续 story
- `UpdateCompanyDto.nameCn` 缺少 `@IsNotEmpty()`，空字符串可绕过唯一性检查（`update-company.dto.ts`）— pre-existing 模式，与其他 DTO 一致
- `contactPhone` 仅有 `MaxLength(50)` 无格式校验（`create-company.dto.ts`）— pre-existing 设计决策
- `bigint` DB 列（country_id / chief_accountant_id）TypeScript 层类型为 `number`，超大 ID 精度风险（`company.entity.ts`）— pre-existing 项目级模式，实际 ID 范围安全

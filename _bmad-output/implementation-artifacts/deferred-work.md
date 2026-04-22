# Deferred Work

## Deferred from: code review of 3-4-产品faq维护 (2026-04-22)

- **spu_id 缺 DB 外键约束**：迁移文件仅创建了索引，未添加 FK 约束到 `spus` 表。服务层已做存在性校验，DB 层无级联保护。
- **spuId 类型精度问题**：JS `number` 无法安全表示 64-bit bigint，Entity 和前端接口均声明为 `number`。在 ID 超过 `Number.MAX_SAFE_INTEGER` 前无实际风险，项目内一致处理方式。
- **Repository.update() 非原子**：`this.repo.update(id, data)` + `findOneOrFail` 之间存在窗口期。并发删除会导致 `EntityNotFoundError` 而非 `NotFoundException`。低频场景，可用事务包裹改善。
- **service.delete() TOCTOU 竞态**：`findById` 校验与 `repo.delete` 非原子，并发删除产生静默 no-op。低频场景。
- **normalizeApiError 丢失调用栈**：对非对象类型错误抛出 `{ message: '...' }` 普通对象，无 stack trace，影响生产调试。
- **UpdateSpuFaqDto 允许空请求体**：所有字段均为 `@IsOptional()`，`PATCH {}` 通过校验。可添加 AtLeastOne 自定义装饰器。
- **answer 无最大长度限制**：`text` 列理论无上限，DTO 未设 `@MaxLength`，可视业务需要补充。
- **spuId 通过请求体传入**：REST 设计上可改为路由参数 `/spus/:spuId/faqs`，但当前项目已有一致模式。
- **迁移 down() 未显式删索引**：TypeORM/MySQL 删表时自动级联删除索引，通常无问题。
- **QuerySpuFaqDto.spuId 缺失时转换为 NaN**：`@Type(() => Number)` 将 undefined 转为 NaN，class-validator `@IsInt()` 会拒绝返回 400，行为可接受。

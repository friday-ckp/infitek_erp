# Deferred Work

## Deferred from: code review of 2-4-搜索筛选与分页横切能力 (2026-04-20)

- `PaginatedResponse<T>` 与 `PaginationResult<T>` 重复：前者新增 totalPages 字段，应在后续重构中整合为单一标准类型并迁移消费方。
- 折叠按钮文字"展开高级筛选"/"收起高级筛选"偏离 UX 规范"高级筛选"/"收起"，功能正确，仅文字风格差异，需与 UX 团队确认最终措辞。
- `applyKeywordFilter` alias/fields 直接插值入 SQL（当前均为开发者硬编码，不是用户输入）。若将来开放动态字段选择，需改为白名单校验。
- `applyKeywordFilter` 参数名 kw0/kw1 若在同一 QB 多次调用会冲突，建议未来版本引入调用计数器或前缀避免冲突。
- `onClearAll` prop 为 undefined 时不显示"清除全部"；UX 规范要求仅由 activeTags.length>0 控制，建议后续使用时始终传入回调或改为 required prop。

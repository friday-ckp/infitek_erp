# Deferred Work

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

## Deferred from: code review of 2-4-搜索筛选与分页横切能力 (2026-04-20)

- `PaginatedResponse<T>` 与 `PaginationResult<T>` 重复：前者新增 totalPages 字段，应在后续重构中整合为单一标准类型并迁移消费方。
- 折叠按钮文字"展开高级筛选"/"收起高级筛选"偏离 UX 规范"高级筛选"/"收起"，功能正确，仅文字风格差异，需与 UX 团队确认最终措辞。
- `applyKeywordFilter` alias/fields 直接插值入 SQL（当前均为开发者硬编码，不是用户输入）。若将来开放动态字段选择，需改为白名单校验。
- `applyKeywordFilter` 参数名 kw0/kw1 若在同一 QB 多次调用会冲突，建议未来版本引入调用计数器或前缀避免冲突。
- `onClearAll` prop 为 undefined 时不显示"清除全部"；UX 规范要求仅由 activeTags.length>0 控制，建议后续使用时始终传入回调或改为 required prop。

# 操作记录统一规范

## 1. 目标

统一全系统操作记录展示规范，保证所有模块在新增、更新、删除场景下的展示语义一致、文案一致、语言一致（中文）。

## 2. 展示规则

### 2.1 新增（CREATE）
- 仅展示一条摘要："新增数据：已新增"。
- 不展示字段列表。
- 不展示字段英文名。
- 不展示任何 ID。

### 2.2 更新（UPDATE）
- 必须展示为"由什么改为什么"。
- old/new 值必须是用户可读中文语义，不允许直接暴露：
  - 字段英文名
  - 枚举编码
  - 外键 ID
  - 技术内部值
- 当字段值是空时统一显示"—"。
- 布尔值统一显示"是/否"。

### 2.3 删除（DELETE）
- 展示删除前的业务可读值。
- 不展示字段英文名、枚举编码、ID。

## 3. 语言与可读性要求

- 字段名称必须为中文标签。
- 枚举值必须为中文文案。
- 下拉单选/关联字段（外键）必须显示名称，不显示 ID。
- 所有面向业务用户的展示文本必须中文。

## 4. 代码落地点（必须同时维护）

每次新增资源类型或新增可审计字段时，必须同步检查并补齐以下位置：

1. `packages/shared/src/types/operation-log-field-labels.ts`
   - 在 `RESOURCE_OPERATION_LOG_FIELD_LABELS[resourceType]` 中补齐字段中文标签。
2. `apps/web/src/components/ActivityTimeline.tsx`
   - 枚举字段：补齐 `ENUM_VALUE_LABELS` 或 `RESOURCE_ENUM_VALUE_LABELS`。
   - 外键字段：补齐 `FIELD_LOOKUP_RESOLVERS`，将 ID 转换为业务名称。
   - ID/Name 成对字段：补齐 `DISPLAY_COMPANION_FIELDS`，优先展示 Name 字段值。

## 5. 新 Story 开发检查清单

- [ ] 详情页不得新增独立"审计信息"区块；创建人、更新时间等追踪信息统一从"操作记录"消费
- [ ] 所有详情页必须包含"操作记录"区块，并使用统一 `ActivityTimeline`
- [ ] CREATE 是否仅显示"已新增"
- [ ] UPDATE 是否完整显示"由旧值到新值"
- [ ] 是否存在任何英文字段名泄露
- [ ] 是否存在任何 ID 泄露
- [ ] 所有枚举是否已中文化
- [ ] 所有关联字段是否已名称化
- [ ] ActivityTimeline 中是否已补齐 resolver / enum / companion 映射

## 6. 验收口径

以下任一情况出现即判定为不通过：
- 展示字段英文名（如 `customerId`、`status`）
- 展示纯 ID（如 `123`，但无对应名称）
- 展示未翻译枚举编码（如 `pending_submit`）
- 新增操作出现字段级噪音信息

## 7. 维护原则

- 变更操作记录能力时，优先保证展示一致性，不引入例外分支。
- 新模块上线前，必须人工抽查至少 1 条 CREATE、1 条 UPDATE、1 条 DELETE 记录。
- 审核重点是"业务可读性"而不是"技术完整性"。

---
version: 2.0
date: 2026-04-25
status: active
visual-refs:
  - ui-preview.html                                    # 列表 / 详情 / 编辑页视觉原型
  - _bmad-output/planning-artifacts/ux-design-directions.html  # 流程详情页视觉原型
supersedes:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/ux-std-detail-edit-page.md
---

# Infitek ERP UX 规范 v2.0

> 本文档是系统唯一权威 UX 规范。所有页面开发必须遵循此规范。
> 视觉原型见上方 `visual-refs`，代码实现参考 `apps/web/src/pages/master-data/spus/`。

---

## 1. 设计 Token

```css
:root {
  /* 主色 */
  --primary:        #2563EB;
  --primary-hover:  #1D4ED8;
  --primary-light:  #EFF6FF;   /* 浅蓝背景 */

  /* 语义色 */
  --success:        #10B981;
  --success-light:  #ECFDF5;
  --warning:        #F59E0B;
  --warning-light:  #FFFBEB;
  --danger:         #EF4444;
  --danger-light:   #FEF2F2;

  /* 灰阶 */
  --gray-50:  #F8FAFC;
  --gray-100: #F1F5F9;
  --gray-200: #E2E8F0;
  --gray-300: #CBD5E1;
  --gray-400: #94A3B8;
  --gray-500: #64748B;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1E293B;
  --gray-900: #0F172A;

  /* 布局尺寸 */
  --sidebar-w:  220px;
  --topbar-h:   56px;

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
}
```

---

## 2. 全局布局

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (220px)  │  Topbar (56px)                   │
│                   ├──────────────────────────────────┤
│                   │  Content (flex-1, overflow-auto) │
└──────────────────────────────────────────────────────┘
```

- **Sidebar**：白底，右侧 `1px solid var(--gray-200)`，固定宽度 220px
- **Topbar**：白底，下边框 `1px solid var(--gray-200)`，高度 56px，内容 `padding: 0 24px`
- **Content**：背景 `var(--gray-50)`，`padding: 24px`，可滚动

---

## 3. 导航规范

### 3.1 侧边栏导航

```
nav-parent（一级菜单）
  └── nav-sub（二级菜单，pill 样式激活）
```

- 一级菜单：图标 + 文字 + 折叠箭头，激活时图标变主色
- 二级菜单：`border-radius: 999px`，激活时 `background: #EEF2FF; color: var(--primary); font-weight: 700`
- 底部固定用户信息区（头像 + 姓名 + 角色 + 设置/退出图标）

### 3.2 面包屑

格式：`模块名 › 列表名 › 记录标识`（详情）或 `模块名 › 列表名 › 编辑 记录标识`（编辑）

- 模块名、列表名：可点击，`color: var(--gray-400)`
- 当前页：`color: var(--gray-800); font-weight: 600`
- 分隔符：`›`，`color: var(--gray-300)`
- 面包屑是唯一路径导航，页面内容区不得重复渲染

---

## 4. 页面模式 A：列表页

> 视觉参考：`ui-preview.html` → 列表页 tab

### 结构

```
页面标题 + 副标题
统计卡片行（可选，4列）
工具栏（搜索 + 筛选 + 操作按钮）
数据表格
分页
```

### 统计卡片（stat-card）

- 4 列等宽网格，`gap: 12px`
- 每张卡片：图标区（40×40，圆角背景）+ 数字（22px bold）+ 标签（12px）
- 图标背景色对应语义：蓝/绿/橙/灰

### 工具栏

- 搜索框：280px，左侧搜索图标，focus 时蓝色边框 + 3px 光晕
- 筛选按钮：白底边框，激活筛选条件显示为 pill 标签（可删除）
- 主操作按钮（新建等）靠右

### 数据表格

- 表头：`background: var(--gray-50)`，`font-size: 11px`，`text-transform: uppercase`，`font-weight: 700`
- 数据行：hover 时 `background: var(--gray-50)`
- 行内操作按钮：默认隐藏，hover 时显示（`opacity: 0 → 1`）
- 编码列（如单号、SKU）：`color: var(--primary); font-weight: 600; cursor: pointer`，点击进入详情
- 空值：显示 `—`

### 分页

- 左侧显示总记录数，右侧页码按钮
- 当前页：`background: var(--primary); color: white`

---

## 5. 页面模式 B：详情页

> 视觉参考：`ui-preview.html` → 详情页 tab
> 代码参考：`apps/web/src/pages/master-data/spus/detail.tsx`

### 结构

```
Topbar（面包屑 + 状态标签 + 编辑/删除按钮）
摘要卡片（Summary Card）
┌──────────────────────────────────────────┐
│ 锚点导航（160px）│ 内容区（flex-1）       │
│  · 基本信息      │  Section Card × N     │
│  · 规格参数      │  操作记录（时间线）    │
│  · ...          │                        │
└──────────────────────────────────────────┘
```

### 摘要卡片（Summary Card）

- 白底，`border-radius: var(--radius-lg)`，`padding: 20px 24px`
- 必含：记录编码（22px bold）+ 状态 pill + 3-5 个关键字段 + 操作按钮组（右上角）
- 操作按钮：编辑（default 样式）+ 删除（danger 样式）

### 锚点导航（AnchorNav）

- 宽 160px，`position: sticky; top: 0`
- 激活项：`background: var(--primary-light); color: var(--primary); border-left: 3px solid var(--primary); font-weight: 600`

### Section Card

- 白底，`border: 1px solid var(--gray-200)`，`border-radius: var(--radius-lg)`
- 卡片头：`padding: 14px 20px`，标题左侧 8px 圆点（颜色区分模块）
- 字段展示：`field-grid`，默认 3 列，长文本 `span 3`

### 字段展示规范

```
field-label：11px，font-weight: 600，color: var(--gray-400)，uppercase，letter-spacing: 0.4px
field-value：14px，font-weight: 500，color: var(--gray-800)
空值：color: var(--gray-300)，显示 —
```

### 操作记录（时间线）

- 最新事件在上，时间格式 `YYYY-MM-DD HH:mm`
- 圆点：主色（最新）/ 灰色（历史）
- 圆点间连线：`1px solid var(--gray-200)`

---

## 6. 页面模式 C：编辑页 / 新建页

> 视觉参考：`ui-preview.html` → 编辑页 tab

### 与详情页的区别

| 项目 | 详情页 | 编辑页 |
|------|--------|--------|
| 摘要卡片 | 显示 | 不显示 |
| 面包屑 | `› 记录标识` | `› 编辑 记录标识` |
| 内容 | 只读字段 | 表单输入 |
| 底部 | 无 | 固定 footer（取消 + 保存） |

### 表单布局

- 默认 3 列网格（`form-grid`），长文本 `span 3`
- 表单标签：12px，`font-weight: 600`，`color: var(--gray-600)`
- 必填标记：`color: var(--danger)`，标签后 `*`

### 表单组件

| 类型 | 组件 |
|------|------|
| 单行文本 | `<input class="form-input">` |
| 多行文本 | `<textarea class="form-input">` |
| 下拉选择 | `<select class="form-input form-select">` |
| 数字 | `<input type="number">` |
| 关联实体 | 搜索选择器（EntitySearchSelect） |

### 固定底部 Footer

- `position: fixed; bottom: 0; left: var(--sidebar-w); right: 0`
- 白底，上边框，`padding: 12px 24px`
- 按钮靠右：取消（default）+ 保存（primary）
- 左侧可选显示提示信息（如"* 为必填项"）

---

## 7. 页面模式 D：流程详情页

> 适用场景：带有明确业务流程步骤的单据详情（如发货需求、采购订单等）
> 视觉参考：`_bmad-output/planning-artifacts/ux-design-directions.html`
> 注意：视觉原型中主色为 `#4F46E5`，实际实现统一使用 `#2563EB`

### 结构

```
Topbar（面包屑 + 状态 pill + 返回/编辑按钮 + 通知铃）
页面标题 + 副标题（单号 · 来源单据 · 客户）
流程进度条
KPI 卡片行（4列）
基本信息卡片（含关联单据快捷按钮）
产品明细卡片（含操作按钮行）
操作记录（时间线）
```

### 流程进度条（Progress Steps）

- 白底卡片，`padding: 20px 28px`
- 步骤圆点：已完成（绿色 + 勾）/ 当前（主色 + 光晕）/ 待处理（白底灰边框）
- 步骤间连线：已完成段变绿色

### KPI 卡片行

- 4 列等宽，`gap: 14px`
- 数字大（24px bold），颜色对应语义（蓝/橙/红/默认）
- 副文字（12px）说明状态

### 基本信息卡片

- 使用 `meta-grid`（3 列）展示字段
- 底部"关联单据快捷按钮"区（smart-btns）：每个按钮显示关联单据类型 + 数量徽标
  - 有数据：主色徽标
  - 无数据：灰色徽标

### 产品明细卡片

- 表格展示 SKU 明细，含库存状态 pill（绿/红）
- 底部操作行（action-row）：灰底，放置主要操作按钮

### 操作记录（时间线）

- 同模式 B，最新在上

---

## 8. 通用组件

### 按钮

| 类型 | 用途 | 样式 |
|------|------|------|
| btn-primary | 主操作（新建、保存、确认） | 蓝底白字 |
| btn-default | 次要操作（返回、取消、筛选） | 白底灰边 |
| btn-danger | 危险操作（删除） | 白底红字，hover 红底 |
| btn-ghost | 内联操作（查看详情） | 透明底蓝字 |
| btn-sm | 表格行内操作 | 同上，padding 缩小 |

### 状态标签

| 语义 | pill 样式 | tag 样式 | 适用状态 |
|------|-----------|----------|---------|
| 正常/完成 | pill-green | tag-green | 上架、已完成、充足 |
| 进行中 | pill-blue | tag-blue | 采购中、进行中 |
| 警告/待处理 | pill-orange | tag-orange | 待发运、临期 |
| 异常/停用 | pill-red | tag-red | 缺货、已作废 |
| 草稿/默认 | — | tag-gray | 草稿、待处理 |

- `pill`：`border-radius: 999px`，左侧带颜色圆点，用于页面级状态展示
- `tag`：`border-radius: 4px`，用于表格内状态列

### SKU 编码样式

```css
.sku-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; font-weight: 700;
  color: #2563EB; background: #EFF6FF;
  padding: 4px 8px; border-radius: 6px; border: 1px solid #DBEAFE;
}
```

---

## 9. 废弃文档

以下文档已被本规范取代，不再维护，仅作历史参考：

| 文件 | 废弃原因 |
|------|---------|
| `ux-design-specification.md` | 旧版全量规范，与实际实现不符 |
| `ux-std-detail-edit-page.md` | 描述 Tab 布局，实际代码用锚点导航 |
| `sidebar-v1/v2/v3-*.html` | 侧边栏探索稿，已定稿为 pill 样式 |
| `category-v1/v2/v3-*.html` | 分类页探索稿 |

---
status: DEPRECATED
superseded-by: _bmad-output/planning-artifacts/ux-spec.md
type: ux-standard
scope: detail-edit-page
status: approved
date: 2026-04-23
prototype: _bmad-output/prototypes/sku-detail-edit-prototype.html
appliesTo: 所有业务模块的详情页和编辑页
---

# 详情页 / 编辑页 UX 规范（UX-STD-DETAIL-EDIT）

本规范定义 infitek_erp 系统中所有业务模块详情页和编辑页的统一布局、交互模式和组件选型。后续所有模块开发必须遵循本规范，确保全系统体验一致性。

原型参考：`_bmad-output/prototypes/sku-detail-edit-prototype.html`

---

## 1. 页面结构（三层布局）

所有详情页和编辑页采用统一的三层结构：

```
┌─────────────────────────────────────────────┐
│  Topbar: 面包屑导航 + 状态标签 + 用户头像    │
├─────────────────────────────────────────────┤
│  摘要卡片 (Summary Card) — 仅详情页          │
├─────────────────────────────────────────────┤
│  Tabs 容器 (info-card + tabs-bar + tab-body) │
│  ┌─────┬─────┬─────┬─────┬─────┐           │
│  │Tab1 │Tab2 │Tab3 │ ... │TabN │           │
│  └─────┴─────┴─────┴─────┴─────┘           │
│  [当前 Tab 内容区]                           │
│  ── 编辑页底部: [取消] [保存] ──             │
└─────────────────────────────────────────────┘
```

### 1.1 Topbar 面包屑

- 格式：`模块名 › 列表名 › 记录标识`（详情页）或 `模块名 › 列表名 › 编辑 记录标识`（编辑页）
- 模块名和列表名为可点击链接（`color: var(--primary)`），记录标识为当前页（`font-weight: 600`）
- 分隔符使用 `›`
- 面包屑属于全局 Topbar 导航，列表页、新建页、详情页、编辑页必须连续可见，禁止因动态路由切换而消失
- 顶栏面包屑是页面唯一的路径导航，页面内容区不得重复渲染第二套局部面包屑
- 左侧导航当前模块与子菜单高亮必须和面包屑同步，用户进入 `/:id`、`/:id/edit`、`/create` 等派生路由时仍应保持所属模块上下文

### 1.2 摘要卡片（Summary Card）

仅详情页显示，编辑页不显示。用于在 Tab 切换时始终展示核心识别信息。

**必含元素：**
- 记录编码（`font-size: 20px; font-weight: 800`）
- 状态标签（pill 样式，跟随编码右侧）
- 3-5 个关键摘要字段（使用 `summary-meta-item` 布局）
- 操作按钮组（右上角）：编辑按钮（`btn2-default`）+ 删除按钮（`btn2-danger`）

**摘要字段选取原则：**
- 选择用户在任何 Tab 下都需要参考的核心识别信息
- 通常包括：所属上级实体、类型/分类、关键业务属性
- 不超过 5 个字段

**样式规范：**
```css
.summary-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid var(--border-base);
  padding: 20px 24px;
  margin-bottom: 16px;
}
```

### 1.3 Tabs 容器

详情页和编辑页均使用 Tab 组织内容，外层为 `info-card` 卡片。

**Tab 分类规则：**

| Tab 类型 | 详情页 | 编辑页 | 说明 |
|---------|--------|--------|------|
| 可编辑数据 Tab | 显示（只读） | 显示（表单） | 如：基本信息、规格参数、报关信息 |
| 只读关联 Tab | 显示 | 不显示 | 如：负责人信息、证书资料 |
| 子表/列表 Tab | 显示（只读表格） | 显示（可编辑表格） | 如：包装信息 |

**Tab 命名规范：**
- 使用 2-4 个汉字的简短名称
- 避免使用"其他"作为 Tab 名，应按业务含义命名

---

## 2. 详情页规范

### 2.1 数据展示组件

使用 `meta-grid`（三列网格）展示字段，替代 ProDescriptions 的两列布局。

```html
<div class="meta-grid">
  <div class="meta-item">
    <div class="meta-label">字段名</div>
    <div class="meta-value">字段值</div>
  </div>
</div>
```

**布局规则：**
- 默认三列（`grid-template-columns: repeat(3, 1fr)`）
- 长文本字段（描述、备注、申报要素等）使用 `grid-column: span 3` 占满整行
- 图片列表、Tag 列表等复合内容同样占满整行
- 空值统一显示 `—`（em dash），颜色 `var(--text-light)`

**字段标签样式：**
```css
.meta-label {
  font-size: 11px;
  color: var(--text-light);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}
```

### 2.2 列表型 Tab

使用 `data-table` 展示子表数据（如包装信息、证书资料）。

**必含元素：**
- 表头（`background: #F9FAFB`，`font-size: 12px`，`text-transform: uppercase`）
- 数据行（`hover` 背景 `#FBFBFF`）
- 底部记录数（`共 N 条记录`，右对齐）
- 操作列（如有）：使用 `btn2-link` 样式

### 2.3 只读关联 Tab

用于展示来自其他模块的关联数据，不可编辑。

**必含元素：**
- 数据展示（`meta-grid` 或 `data-table`）
- 信息提示条（`info-tip`）：说明数据来源和修改方式

```html
<div class="info-tip">
  ℹ 负责人信息来源于产品三级分类「电钻」的关联配置，如需修改请前往产品分类管理。
</div>
```

### 2.4 操作记录（时间线）Tab

用于展示记录生命周期内的关键操作事件（创建、状态变更、提交、审核、系统回写等），统一采用时间线样式，禁止以普通段落堆叠。

**适用规则：**
- 详情页：可作为独立 Tab（复杂模块）或卡片区块（中等模块）
- 编辑页：默认不展示（只读历史信息）
- 记录条目按时间倒序（最新在上）

**必含元素：**
- 时间线容器（`master-status-timeline`）
- 事件项（`master-tl-item`）：圆点 + 文本 + 时间
- 事件文本（`master-tl-text`）：可包含关联单据链接或状态 tag
- 事件时间（`master-tl-time`）：统一 `YYYY-MM-DD HH:mm`

```html
<div class="master-status-timeline">
  <div class="master-tl-item">
    <div class="master-tl-dot"></div>
    <div class="master-tl-content">
      <div class="master-tl-text">小王 创建了采购订单 PO-2026-0089</div>
      <div class="master-tl-time">2026-04-12 15:10</div>
    </div>
  </div>
</div>
```

### 2.5 状态标签映射

详情页中所有状态字段必须使用 pill 或 tag 样式，禁止纯文字展示。

| 语义 | 样式类 | 适用状态 |
|------|--------|---------|
| 正常/启用/上架 | `pill-green` / `tag-green` | 上架、启用、已完成、已维护 |
| 进行中/处理中 | `pill-blue` / `tag-blue` | 采购中、进行中、已确认 |
| 警告/待处理 | `pill-orange` / `tag-orange` | 临拓、待发运、通用归属 |
| 停用/异常 | `tag-red` | 下架不可售、已作废 |
| 默认/草稿 | `tag-gray` | 下架可售、草稿、待处理 |

---

## 3. 编辑页规范

### 3.1 整页编辑模式

点击详情页"编辑"按钮后跳转到独立编辑页（`/module/:id/edit`），保留 Tab 分组结构。

**编辑页与详情页的区别：**
- 无摘要卡片
- 面包屑标题变为"编辑 XXX"
- 仅显示可编辑的 Tab（去掉只读关联 Tab）
- Tab 内容从 `meta-grid` 变为表单
- 底部固定"取消 + 保存"按钮

### 3.2 表单布局

使用 `form-row` 网格布局，默认两列。

```html
<div class="form-row">
  <div class="form-item">
    <label><span class="req">*</span>字段名</label>
    <input class="form-input" />
  </div>
  <div class="form-item">
    <label>字段名</label>
    <select class="form-input form-select">...</select>
  </div>
</div>
```

**布局规则：**

| 场景 | 列数 | CSS 类 |
|------|------|--------|
| 默认 | 2 列 | `form-row` |
| 三级联动（如分类） | 3 列 | `form-row col3` |
| 长文本（描述、备注） | 1 列 | `form-row full` |

**表单标签样式（与详情页 meta-label 一致）：**
```css
.form-item label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### 3.3 字段类型与组件映射

| 字段类型 | 组件 | 说明 |
|---------|------|------|
| 文本输入 | `<input class="form-input">` | 单行文本 |
| 长文本 | `<textarea class="form-input">` | 多行，`min-height: 56px` |
| 单选下拉 | `<select class="form-input form-select">` | 枚举值选择 |
| 多选下拉 | `multi-tags` 组件 | Tag 模式，可逐个删除 |
| 是/否选择 | `radio-group` | 两个 radio button |
| 数字输入 | `<input type="number">` | 带 `step` 和 `min/max` |
| 图片上传 | `upload-area` 组件 | 缩略图列表 + 上传按钮 |
| 关联实体选择 | `<select>` 或 `EntitySearchSelect` | 搜索选择 |

### 3.4 条件显示字段

当某个字段的值影响其他字段的显示/隐藏时，使用条件块：

```html
<div class="cond-block" id="conditionalBlock">
  <div class="cond-label">▼ 条件说明文字</div>
  <div class="form-row">...</div>
</div>
```

**样式：** 虚线边框 + 浅紫背景（`border: 1px dashed #C7D2FE; background: #FAFAFF`），视觉上与常规字段区分。

### 3.5 可编辑表格

子表数据（如包装信息）使用 `editable-table`：

**必含元素：**
- 右上角"+ 添加"按钮（`btn2-dashed`）
- 表格内每个单元格为 `form-input`
- 操作列：删除按钮（`btn2-link` 红色）
- 自动计算字段设为 `disabled`，附 `info-tip` 说明计算规则

### 3.6 表单底部

固定在 Tab 容器底部，包含：
- 取消按钮（`btn2-default`）：返回详情页
- 保存按钮（`btn2-primary`）：提交表单

```css
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
}
```

---

## 4. 交互规范

### 4.1 Tab 切换

- Tab 切换不触发页面跳转，仅切换内容区
- 编辑页切换 Tab 时保留已填写的表单数据（同一个 ProForm 实例）
- 当前 Tab 高亮：`color: var(--primary); border-bottom: 2px solid var(--primary)`

### 4.2 表单校验

- 必填字段标签前加红色星号（`<span class="req">*</span>`）
- 校验时机：提交时统一校验，焦点离开时单字段校验
- 校验失败：输入框边框变红 + 下方红色提示文字
- 条件必填：归属类型选择非通用归属时，对应字段变为必填

### 4.3 联动规则

- 三级分类联动：选择一级后过滤二级选项，选择二级后过滤三级选项
- 条件字段显示：产品类型选"配件"时显示"配件归属SKU"字段
- 自动计算：包装信息中体积 = 长 × 宽 × 高 ÷ 1,000,000

### 4.4 操作反馈

| 操作 | 反馈方式 |
|------|---------|
| 保存成功 | `message.success` 3秒 + 跳转详情页 |
| 保存失败 | `message.error` 5秒 |
| 删除 | `Modal.confirm` 二次确认 |
| 取消编辑 | 直接返回详情页（无确认弹窗） |

---

## 5. 技术实现映射

### 5.1 前端组件对应

| 规范元素 | Ant Design Pro 组件 | 说明 |
|---------|-------------------|------|
| 摘要卡片 | `ProCard` | 自定义布局 |
| Tabs 容器 | `Tabs` (antd) | 包裹在 `ProCard` 内 |
| 详情数据网格 | `ProDescriptions` | `column={3}` 三列布局 |
| 表单 | `ProForm` + `ProFormItem` 系列 | 保留 Tab 结构 |
| 只读表格 | `ProTable` | `search={false}` |
| 可编辑表格 | `ProForm.List` 或 `EditableProTable` | 支持增删行 |
| 状态标签 | `Tag` (antd) | 使用 `color` 属性 |
| 状态胶囊 | `Badge` + 自定义样式 | pill 样式 |

### 5.2 路由规范

| 页面 | 路由 | 说明 |
|------|------|------|
| 列表页 | `/module-group/module` | 如 `/master-data/skus` |
| 详情页 | `/module-group/module/:id` | 如 `/master-data/skus/123` |
| 新建页 | `/module-group/module/create` | 编辑页复用，无 id |
| 编辑页 | `/module-group/module/:id/edit` | 编辑页复用，有 id |

### 5.3 数据获取

- 详情页：`useQuery(['module-detail', id])` 获取主数据
- 关联 Tab 数据：独立 `useQuery`，`enabled` 依赖主数据加载完成
- 编辑页：复用详情 query 作为 `initialValues`
- 子表数据：嵌套在主数据中或独立接口

---

## 6. 模块适配指南

### 6.1 简单模块（< 10 字段）

如：币种、单位、国家/地区

- 无需 Tab，单个 `meta-grid` / 单个表单卡片即可
- 摘要卡片可省略，直接在 Topbar 面包屑中体现记录标识
- 编辑可考虑 Drawer 模式（从列表页直接编辑）

### 6.2 中等模块（10-30 字段）

如：SPU、仓库、公司主体、供应商

- 2-3 个 Tab 分组
- 摘要卡片展示 3-4 个核心字段
- 标准详情/编辑页模式

### 6.3 复杂模块（> 30 字段）

如：SKU、发货需求、采购订单

- 4-6 个 Tab 分组
- 摘要卡片展示 4-5 个核心字段
- 可能包含只读关联 Tab 和子表 Tab
- 编辑页仅展示可编辑 Tab

### 6.4 交易单据模块

如：销售订单、采购订单、物流单

- 摘要卡片额外包含：流程进度条（`FlowProgress`）、Smart Button 计数器
- Tab 中包含：产品明细（子表）、操作记录（统一 `master-status-timeline` 时间线样式）
- 状态推进按钮放在摘要卡片操作区或产品明细表格下方

---

## 7. CSS 变量速查

所有样式必须使用以下 CSS 变量，禁止硬编码颜色值：

```css
--primary: #4F46E5;        /* 主色 */
--primary-hover: #4338CA;  /* 主色悬停 */
--primary-bg: #EEF2FF;     /* 主色浅背景 */
--text-main: #111827;      /* 主文字 */
--text-muted: #6B7280;     /* 次要文字 */
--text-light: #9CA3AF;     /* 辅助文字 */
--bg-app: #F9FAFB;         /* 页面背景 */
--border-base: #E5E7EB;    /* 主边框 */
--border-light: #F3F4F6;   /* 轻边框 */
```

---

## 8. Checklist（开发自检）

开发每个模块的详情/编辑页时，对照以下清单：

- [ ] 面包屑导航格式正确，模块名可点击返回
- [ ] 详情页有摘要卡片（简单模块除外），包含编码 + 状态 + 核心字段
- [ ] 内容按业务含义分 Tab，Tab 名称 2-4 字
- [ ] 涉及流程的页面包含操作记录时间线（倒序展示）
- [ ] 详情页使用三列 `meta-grid` 展示数据
- [ ] 所有状态字段使用 pill/tag 样式，禁止纯文字
- [ ] 空值统一显示 `—`
- [ ] 编辑页去掉只读关联 Tab
- [ ] 表单默认两列布局，长文本占满整行
- [ ] 必填字段有红色星号
- [ ] 条件显示字段使用 `cond-block` 样式
- [ ] 子表使用可编辑表格，支持增删行
- [ ] 底部有"取消 + 保存"按钮
- [ ] 保存成功后跳转详情页并显示 success 提示
- [ ] 删除操作有 Modal 二次确认

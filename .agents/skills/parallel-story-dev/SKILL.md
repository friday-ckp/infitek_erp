---
name: parallel-story-dev
description: 并行 Story 开发编排器。读取 sprint-status.yaml 找出所有 backlog story，分析代码依赖关系，将可并行的 story 分组，输出多窗口并行开发指令。每个窗口执行独立的 start story 命令并使用 worktree 隔离，互不干扰。当用户说"并行开发"、"parallel dev"、"开多个窗口"、"并行跑 story"、"多窗口并行"时触发。
---

# Parallel Story Dev

## 工作流程

### Step 1：读取 Sprint 状态

读取 `_bmad-output/implementation-artifacts/sprint-status.yaml`，提取所有状态为 `backlog` 的 story。

### Step 2：依赖分析（激进模式）

对每个 backlog story，按以下顺序判断依赖：

**2a. 检查已有 story 文件**

在 `_bmad-output/implementation-artifacts/` 查找对应 story 文件（如 `2-1-*.md`）。若存在，读取其 Prerequisites / Dependencies 部分，提取明确的代码依赖。

**2b. 无 story 文件时，读 epics 文件推断**

读取 `_bmad-output/planning-artifacts/epics.md`，找到每个 story 的描述和 Acceptance Criteria，判断是否有明确的代码依赖（如"复用 X 模板"、"调用 X 服务"、"依赖 X 数据模型"）。

**2c. 启发式补充规则**

- story 名称含"模板"、"框架"、"基础设施" → 同 epic 后续 story 可能依赖它
- 其余 story 默认**可并行**，除非有明确依赖词

**2d. 跨 epic 规则**

不同 epic 的 story **始终可并行**，无需分析依赖。

### Step 3：展示依赖图 + 让用户选择

**先输出完整依赖分析表**，格式如下：

```
## 所有 Backlog Story 依赖分析

| Story | 名称 | 依赖 | 可立即开发 |
|-------|------|------|-----------|
| 1-5 | 前端全局框架 | 无（1-3 已 done） | ✅ |
| 2-1 | 标准CRUD组件模板 | 无 | ✅ |
| 2-2 | 基础参考数据管理 | 依赖 2-1（复用模板） | ⏳ |
| 3-1 | 三级产品分类管理 | 无（后端独立） | ✅ |
...

### 依赖链说明
- 2-1 → 2-2, 2-3, 2-4（前端模板复用）
- 1-6 → 3-5, 3-6（OSS 服务）
- Epic 2-4 → Epic 5-8（基础数据）
```

**然后用 AskUserQuestion 让用户选择本次要开发哪些 story**，multiSelect: true，选项为所有 backlog story（标注是否可立即开发）。

### Step 4：根据用户选择生成并行方案

拿到用户选择的 story 列表后：

1. 检查选中的 story 中是否有依赖关系（A 依赖 B，但 B 也被选中）
2. 如果有，自动分批：被依赖的先跑，依赖方后跑
3. 如果用户选了依赖方但没选前置方，**给出警告**："你选了 2-2 但没选 2-1，请确认 2-1 已完成或同时选上"

### Step 5：输出并行指令

```
## 并行开发方案

你选择了 N 个 story，分 M 批执行：

### 第一批（立即并行，共 X 个窗口）

窗口 1：start story {epic}-{story}
窗口 2：start story {epic}-{story}
窗口 3：start story {epic}-{story}

> 每个窗口启动后，在"Optional Steps"选择 Worktree Mode

### 第二批（等第一批 PR 合并后执行）

窗口 1：start story {epic}-{story}
...
```

## 注意事项

- **Worktree 隔离是必须的**：每个窗口必须选择 Worktree Mode，否则多窗口会互相覆盖 git 工作区
- **PR 合并节点**：第二批 story 需等第一批的 PR 合并进 main 后再开始，避免 merge conflict
- **sprint-status 更新**：每个窗口完成后独立更新自己 story 的状态，不会冲突（yaml 不同行）
- **最大并行数**：单次建议不超过 3 个窗口；如选择超过 6 个 story，分多轮执行

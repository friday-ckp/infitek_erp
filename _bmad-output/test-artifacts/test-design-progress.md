---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
lastSaved: '2026-04-17'
status: 'completed'
outputFile: '/Users/chenkangping/ai_study/infitek_erp/_bmad-output/test-artifacts/test-design-epic-1-4.md'
---
mode: 'epic-level'
epic: 'Story 1-4: 用户账号管理'
inputDocuments:
  - /Users/chenkangping/ai_study/infitek_erp/_bmad-output/implementation-artifacts/1-4-用户账号管理.md
  - /Users/chenkangping/ai_study/infitek_erp/_bmad/tea/config.yaml
---

# Story 1-4 测试设计进度

## Step 1: 模式检测

**选择的模式**: Epic-Level Test Design

**原因**: Story 1-4 是一个具体的用户故事，包含明确的验收标准和任务分解。

---

## Step 2: 上下文加载

### 配置信息

- **测试框架**: Jest (NestJS 标准)
- **浏览器自动化**: Playwright (配置为 auto)
- **Playwright Utils**: 已启用
- **Pact.js Utils**: 禁用
- **通信语言**: Chinese
- **测试工件输出**: `{output_folder}/test-artifacts`

### 项目技术栈

**后端**:
- NestJS (TypeScript)
- TypeORM (数据库 ORM)
- Passport.js + JWT (认证)
- Jest (单元测试)

**前端**:
- React 19
- Ant Design (UI 组件库)
- Playwright (E2E 测试)

**共享**:
- TypeScript
- Zod (数据验证)

### Story 1-4 需求概览

**用户故事**: 系统管理员在设置页面创建、查看、编辑、停用用户账号

**验收标准**:
1. 用户列表页面（搜索、筛选、分页）
2. 用户详情页面（显示审计信息）
3. 创建用户（唯一性检查、默认状态）
4. 编辑用户（姓名、密码）
5. 停用用户（二次确认、Token 失效）
6. 权限控制（仅管理员、JWT 认证）

### 现有测试模式

**后端测试结构**:
- Service 单元测试（mock Repository）
- Controller 集成测试（TestingModule）
- 使用 Jest 框架
- 测试文件位置: `__tests__/` 目录

**前端测试**:
- 页面组件测试
- 表单验证测试
- API 调用测试

### 已加载的知识库

- 风险治理框架 (risk-governance)
- 概率-影响矩阵 (probability-impact)
- 测试级别框架 (test-levels-framework)
- 测试优先级矩阵 (test-priorities-matrix)
- Playwright CLI 文档 (playwright-cli)

---

---

## Step 3: 风险和可测试性分析

### 风险评估矩阵

| 风险 ID | 风险描述 | 类别 | 概率 | 影响 | 风险分数 | 优先级 | 缓解策略 |
|---------|---------|------|------|------|---------|--------|---------|
| R1 | 用户名唯一性约束未正确实现，导致重复用户创建 | TECH | 2 | 3 | 6 | 高 | 单元测试验证唯一性检查；集成测试验证数据库约束 |
| R2 | 停用用户后 Token 未立即失效，导致安全漏洞 | SEC | 2 | 3 | 6 | 高 | 集成测试验证 JWT 验证流程；测试停用后的 Token 拒绝 |
| R3 | 权限检查不完整，非管理员可访问用户管理 API | SEC | 2 | 3 | 6 | 高 | 集成测试验证 JwtAuthGuard；测试非管理员访问拒绝 |
| R4 | 分页逻辑错误导致数据遗漏或重复 | TECH | 1 | 2 | 2 | 中 | 集成测试验证分页边界条件 |
| R5 | 搜索/筛选功能不稳定，返回错误结果 | TECH | 1 | 2 | 2 | 中 | 集成测试验证搜索和筛选逻辑 |
| R6 | 前端表单验证不完整，提交无效数据 | TECH | 1 | 2 | 2 | 中 | E2E 测试验证表单验证规则 |
| R7 | 审计字段（created_by/updated_by）未正确填充 | DATA | 1 | 2 | 2 | 中 | 集成测试验证审计字段自动填充 |
| R8 | 前端页面渲染错误或组件崩溃 | TECH | 1 | 1 | 1 | 低 | E2E 测试验证页面渲染和交互 |

### 高风险项缓解计划

**R1: 用户名唯一性约束** (风险分数: 6)
- **缓解**: 
  1. 数据库层：username 字段添加 UNIQUE 约束
  2. Service 层：create() 方法调用 findByUsername() 检查重复
  3. 单元测试：mock Repository 验证重复检查逻辑
  4. 集成测试：实际创建两个相同用户名，验证异常
- **所有者**: 后端开发
- **时间线**: Story 1-4 实现阶段

**R2: 停用用户 Token 失效** (风险分数: 6)
- **缓解**:
  1. JwtStrategy.validate() 中查询完整用户对象并检查 status
  2. 停用用户返回 ACCOUNT_DISABLED 错误
  3. 集成测试：创建用户 → 获取 Token → 停用用户 → 验证 Token 被拒绝
- **所有者**: 后端开发
- **时间线**: Story 1-4 实现阶段

**R3: 权限检查** (风险分数: 6)
- **缓解**:
  1. 所有用户管理 API 端点应用 JwtAuthGuard
  2. 集成测试：以非管理员身份访问 API，验证 403 Forbidden
  3. 集成测试：以管理员身份访问 API，验证成功
- **所有者**: 后端开发
- **时间线**: Story 1-4 实现阶段

---

---

## Step 4: 覆盖计划和执行策略

### 测试覆盖矩阵

#### 后端 API 测试 (API Level)

| 需求 | 测试场景 | 优先级 | 测试类型 | 覆盖范围 |
|------|---------|--------|---------|---------|
| AC1: 用户列表 | 获取用户列表（无筛选） | P0 | API | GET /api/v1/users |
| AC1: 用户列表 | 按用户名搜索 | P1 | API | GET /api/v1/users?search=username |
| AC1: 用户列表 | 按姓名搜索 | P1 | API | GET /api/v1/users?search=name |
| AC1: 用户列表 | 按状态筛选（活跃） | P1 | API | GET /api/v1/users?status=ACTIVE |
| AC1: 用户列表 | 按状态筛选（停用） | P1 | API | GET /api/v1/users?status=INACTIVE |
| AC1: 用户列表 | 分页（第 1 页） | P1 | API | GET /api/v1/users?page=1&pageSize=20 |
| AC1: 用户列表 | 分页（超出范围） | P2 | API | GET /api/v1/users?page=999 |
| AC2: 用户详情 | 获取用户详情 | P0 | API | GET /api/v1/users/:id |
| AC2: 用户详情 | 获取不存在的用户 | P1 | API | GET /api/v1/users/999 (404) |
| AC3: 创建用户 | 创建新用户（成功） | P0 | API | POST /api/v1/users |
| AC3: 创建用户 | 用户名重复 | P0 | API | POST /api/v1/users (409 Conflict) |
| AC3: 创建用户 | 缺少必填字段 | P1 | API | POST /api/v1/users (400 Bad Request) |
| AC3: 创建用户 | 验证默认状态为 ACTIVE | P1 | API | POST /api/v1/users → status=ACTIVE |
| AC4: 编辑用户 | 编辑用户信息（成功） | P0 | API | PATCH /api/v1/users/:id |
| AC4: 编辑用户 | 编辑不存在的用户 | P1 | API | PATCH /api/v1/users/999 (404) |
| AC5: 停用用户 | 停用用户（成功） | P0 | API | POST /api/v1/users/:id/deactivate |
| AC5: 停用用户 | 停用后 Token 失效 | P0 | API | 停用后请求被拒绝 (ACCOUNT_DISABLED) |
| AC6: 权限控制 | 无 Token 访问 | P0 | API | 401 Unauthorized |
| AC6: 权限控制 | 非管理员访问 | P0 | API | 403 Forbidden |
| AC6: 权限控制 | 管理员访问 | P0 | API | 200 OK |

#### 后端单元测试 (Unit Level)

| 组件 | 测试场景 | 优先级 | 覆盖范围 |
|------|---------|--------|---------|
| UsersService.create() | 创建用户成功 | P0 | 密码哈希、created_by 填充 |
| UsersService.create() | 用户名重复异常 | P0 | BadRequestException |
| UsersService.findAll() | 查询所有用户 | P1 | 分页、搜索、筛选逻辑 |
| UsersService.findById() | 查询存在的用户 | P1 | 返回正确用户对象 |
| UsersService.findById() | 查询不存在的用户 | P1 | NotFoundException |
| UsersService.update() | 更新用户信息 | P1 | updated_by 填充 |
| UsersService.deactivate() | 停用用户 | P0 | 状态更新为 INACTIVE |
| JwtStrategy.validate() | 活跃用户验证 | P0 | 返回用户对象 |
| JwtStrategy.validate() | 停用用户验证 | P0 | UnauthorizedException (ACCOUNT_DISABLED) |

#### 前端 E2E 测试 (E2E Level)

| 页面 | 测试场景 | 优先级 | 覆盖范围 |
|------|---------|--------|---------|
| 用户列表页 | 页面加载和渲染 | P0 | 表格、搜索框、筛选器、分页 |
| 用户列表页 | 搜索用户 | P1 | 输入搜索词、验证结果 |
| 用户列表页 | 筛选状态 | P1 | 选择状态、验证结果 |
| 用户列表页 | 分页导航 | P1 | 点击分页按钮、验证数据 |
| 用户列表页 | 查看用户详情 | P1 | 点击详情按钮、跳转到详情页 |
| 用户详情页 | 页面加载和渲染 | P1 | 显示用户信息、审计字段 |
| 用户详情页 | 返回列表 | P2 | 点击返回按钮、跳转到列表页 |
| 用户表单页 | 创建用户表单 | P0 | 表单字段、验证规则 |
| 用户表单页 | 创建用户成功 | P0 | 提交表单、验证成功消息 |
| 用户表单页 | 编辑用户表单 | P1 | 加载用户数据、编辑字段 |
| 用户表单页 | 编辑用户成功 | P1 | 提交表单、验证成功消息 |
| 用户表单页 | 表单验证 | P1 | 必填字段、密码长度、密码一致性 |
| 用户列表页 | 停用用户确认 | P0 | 点击停用、显示确认对话、确认停用 |

### 执行策略

**PR 阶段** (< 15 分钟):
- 所有 P0 API 测试
- 所有 P0 单元测试
- 关键 E2E 测试（页面加载、创建、停用）

**Nightly 阶段**:
- 所有 P1 API 测试
- 所有 P1 单元测试
- 所有 P1 E2E 测试
- 边界条件和错误场景

**Weekly 阶段**:
- 所有 P2 和 P3 测试
- 性能测试（大数据集分页）
- 并发测试（多用户同时操作）

### 资源估算

| 优先级 | 测试数量 | 估算时间 | 说明 |
|--------|---------|---------|------|
| P0 | 12 | 25-40 小时 | 核心功能、高风险、无解决方案 |
| P1 | 18 | 20-35 小时 | 关键路径、中等风险 |
| P2 | 8 | 10-20 小时 | 次要流程、低风险 |
| P3 | 5 | 2-5 小时 | 可选、探索性 |
| **总计** | **43** | **57-100 小时** | 包括实现、审查、调试 |

### 质量门槛

- **P0 通过率**: 100%（必须全部通过）
- **P1 通过率**: ≥ 95%（允许最多 1 个失败）
- **P2 通过率**: ≥ 90%
- **代码覆盖率**: ≥ 80%（Service 和 Controller）
- **高风险缓解**: 必须在发布前完成

---

## 下一步

加载 Step 5: 生成输出文档

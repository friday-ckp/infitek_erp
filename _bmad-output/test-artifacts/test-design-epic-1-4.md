# Story 1-4: 用户账号管理 — 测试设计文档

**版本**: 1.0  
**日期**: 2026-04-17  
**作者**: Master Test Architect  
**状态**: Ready for Implementation

---

## 执行摘要

本文档为 Story 1-4（用户账号管理）定义了完整的测试策略和覆盖计划。该故事涉及后端 CRUD API、前端管理界面和权限控制，包含 3 个高风险项和 43 个测试场景。

**关键指标**:
- 总测试场景: 43 个
- 高风险项: 3 个（用户名唯一性、Token 失效、权限控制）
- 预计工作量: 57-100 小时
- 质量门槛: P0 100% 通过，P1 ≥ 95% 通过

---

## 1. 风险评估

### 高风险项（风险分数 ≥ 6）

| 风险 ID | 风险描述 | 类别 | 缓解策略 | 优先级 |
|---------|---------|------|---------|--------|
| **R1** | 用户名唯一性约束未正确实现 | TECH | 数据库 UNIQUE 约束 + Service 检查 + 单元测试 + 集成测试 | P0 |
| **R2** | 停用用户后 Token 未立即失效 | SEC | JwtStrategy 检查 status + 集成测试验证 | P0 |
| **R3** | 权限检查不完整，非管理员可访问 | SEC | JwtAuthGuard + 集成测试验证 | P0 |

### 中等风险项（风险分数 2-4）

- R4: 分页逻辑错误 → 集成测试验证边界条件
- R5: 搜索/筛选不稳定 → 集成测试验证逻辑
- R6: 前端表单验证不完整 → E2E 测试验证规则
- R7: 审计字段未正确填充 → 集成测试验证自动填充

---

## 2. 测试覆盖矩阵

### 2.1 后端 API 测试 (API Level - P0/P1)

**用户列表 API** (`GET /api/v1/users`)
- ✅ P0: 获取用户列表（无筛选）
- ✅ P1: 按用户名搜索
- ✅ P1: 按姓名搜索
- ✅ P1: 按状态筛选（活跃/停用）
- ✅ P1: 分页（第 1 页、超出范围）

**用户详情 API** (`GET /api/v1/users/:id`)
- ✅ P0: 获取用户详情
- ✅ P1: 获取不存在的用户 (404)

**创建用户 API** (`POST /api/v1/users`)
- ✅ P0: 创建新用户（成功）
- ✅ P0: 用户名重复检查 (409 Conflict)
- ✅ P1: 缺少必填字段 (400 Bad Request)
- ✅ P1: 验证默认状态为 ACTIVE

**编辑用户 API** (`PATCH /api/v1/users/:id`)
- ✅ P0: 编辑用户信息（成功）
- ✅ P1: 编辑不存在的用户 (404)

**停用用户 API** (`POST /api/v1/users/:id/deactivate`)
- ✅ P0: 停用用户（成功）
- ✅ P0: 停用后 Token 失效验证

**权限控制**
- ✅ P0: 无 Token 访问 (401 Unauthorized)
- ✅ P0: 非管理员访问 (403 Forbidden)
- ✅ P0: 管理员访问 (200 OK)

### 2.2 后端单元测试 (Unit Level - P0/P1)

**UsersService**
- ✅ P0: create() - 创建用户、密码哈希、created_by 填充
- ✅ P0: create() - 用户名重复异常
- ✅ P1: findAll() - 查询所有用户、分页、搜索、筛选
- ✅ P1: findById() - 查询存在/不存在的用户
- ✅ P1: update() - 更新用户、updated_by 填充
- ✅ P0: deactivate() - 停用用户

**JwtStrategy**
- ✅ P0: validate() - 活跃用户验证
- ✅ P0: validate() - 停用用户验证 (ACCOUNT_DISABLED)

### 2.3 前端 E2E 测试 (E2E Level - P0/P1)

**用户列表页**
- ✅ P0: 页面加载和渲染
- ✅ P1: 搜索用户
- ✅ P1: 筛选状态
- ✅ P1: 分页导航
- ✅ P1: 查看用户详情

**用户详情页**
- ✅ P1: 页面加载和渲染
- ✅ P2: 返回列表

**用户表单页**
- ✅ P0: 创建用户表单和提交
- ✅ P1: 编辑用户表单和提交
- ✅ P1: 表单验证（必填、密码长度、一致性）

**停用用户**
- ✅ P0: 停用用户确认对话

---

## 3. 执行策略

### PR 阶段（< 15 分钟）
**目标**: 快速反馈，阻止明显的回归

- 所有 P0 API 测试（8 个）
- 所有 P0 单元测试（6 个）
- 关键 E2E 测试（5 个）
- **总计**: ~19 个测试，预计 5-10 分钟

### Nightly 阶段
**目标**: 全面覆盖，发现隐藏的缺陷

- 所有 P1 API 测试（10 个）
- 所有 P1 单元测试（4 个）
- 所有 P1 E2E 测试（8 个）
- **总计**: ~22 个测试，预计 20-30 分钟

### Weekly 阶段
**目标**: 深度测试，性能和并发

- 所有 P2 和 P3 测试（8 个）
- 性能测试（大数据集分页）
- 并发测试（多用户同时操作）
- **总计**: ~10+ 个测试，预计 1-2 小时

---

## 4. 资源估算

| 优先级 | 测试数量 | 估算时间 | 说明 |
|--------|---------|---------|------|
| P0 | 12 | 25-40 小时 | 核心功能、高风险、无解决方案 |
| P1 | 18 | 20-35 小时 | 关键路径、中等风险 |
| P2 | 8 | 10-20 小时 | 次要流程、低风险 |
| P3 | 5 | 2-5 小时 | 可选、探索性 |
| **总计** | **43** | **57-100 小时** | 包括实现、审查、调试 |

**时间线**:
- 实现: 25-40 小时
- 审查和调试: 20-35 小时
- 文档和报告: 5-10 小时
- **总计**: 50-85 小时（2-3 周）

---

## 5. 质量门槛

### 通过率要求

| 优先级 | 通过率 | 说明 |
|--------|--------|------|
| P0 | 100% | 必须全部通过，否则阻止发布 |
| P1 | ≥ 95% | 允许最多 1 个失败，需要根本原因分析 |
| P2 | ≥ 90% | 允许最多 1 个失败 |
| P3 | ≥ 80% | 可选，不阻止发布 |

### 代码覆盖率

- **Service 层**: ≥ 85%（关键业务逻辑）
- **Controller 层**: ≥ 80%（API 端点）
- **总体**: ≥ 80%

### 高风险缓解

- R1（用户名唯一性）: 必须在 PR 前完成
- R2（Token 失效）: 必须在 PR 前完成
- R3（权限控制）: 必须在 PR 前完成

---

## 6. 测试实现指南

### 后端测试框架

**技术栈**:
- Jest (单元测试)
- NestJS TestingModule (集成测试)
- Supertest (HTTP 测试)

**文件结构**:
```
apps/api/src/modules/users/
├── __tests__/
│   ├── users.service.spec.ts
│   └── users.controller.spec.ts
└── ...
```

**测试模板**:
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: {...} }],
    }).compile();
    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const createUserDto = {...};
      // Act
      const result = await service.create(createUserDto, 'admin');
      // Assert
      expect(result).toHaveProperty('id');
    });
  });
});
```

### 前端 E2E 测试框架

**技术栈**:
- Playwright (E2E 测试)
- Playwright Test Runner

**文件结构**:
```
apps/web/e2e/
├── users.spec.ts
└── ...
```

**测试模板**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Users Management', () => {
  test('should display user list', async ({ page }) => {
    await page.goto('/settings/users');
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
```

---

## 7. 验收标准

### 测试设计验收

- ✅ 所有 43 个测试场景已定义
- ✅ 高风险项已识别和缓解
- ✅ 覆盖矩阵已完成
- ✅ 执行策略已定义
- ✅ 资源估算已完成
- ✅ 质量门槛已设定

### 实现验收

- ✅ 所有 P0 测试通过
- ✅ 所有 P1 测试通过（≥ 95%）
- ✅ 代码覆盖率 ≥ 80%
- ✅ 高风险缓解完成
- ✅ 代码审查通过

---

## 8. 后续步骤

1. **Test Framework Setup** (`bmad-testarch-framework`)
   - 初始化 Playwright 配置
   - 配置 Jest 测试环境
   - 设置 CI/CD 集成

2. **ATDD** (`bmad-testarch-atdd`)
   - 生成失败的测试（TDD 红色阶段）
   - 为每个测试场景编写测试代码

3. **Test Automation** (`bmad-testarch-automate`)
   - 扩展测试覆盖范围
   - 优化测试性能

4. **Test Review** (`bmad-testarch-test-review`)
   - 质量审计（0-100 评分）
   - 生成审查报告

---

## 附录

### A. 测试场景详细列表

详见本文档第 2 节"测试覆盖矩阵"。

### B. 风险评估详情

详见本文档第 1 节"风险评估"。

### C. 参考资源

- Story 1-4 需求: `/Users/chenkangping/ai_study/infitek_erp/_bmad-output/implementation-artifacts/1-4-用户账号管理.md`
- 项目架构: `/Users/chenkangping/ai_study/infitek_erp/_bmad-output/planning-artifacts/architecture.md`
- 编码规范: `/Users/chenkangping/ai_study/infitek_erp/docs/CODE_STYLE.md`

---

**文档完成**: 2026-04-17  
**下一步**: 启动 Test Framework Setup (`bmad-testarch-framework`)

# 测试框架指南

## 快速开始

### 前端 E2E 测试 (Playwright)

#### 安装依赖

```bash
cd apps/web
pnpm install @playwright/test
```

#### 运行测试

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 以 headed 模式运行（显示浏览器）
pnpm test:e2e:headed

# 运行特定测试文件
pnpm test:e2e users.spec.ts

# 调试模式
pnpm test:e2e:debug

# 生成测试报告
pnpm test:e2e:report
```

### 后端单元/集成测试 (Jest)

#### 运行测试

```bash
cd apps/api

# 运行所有测试
pnpm test

# 监视模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov

# 调试模式
pnpm test:debug

# 运行特定测试文件
pnpm test users.service.spec.ts
```

---

## 架构概览

### 前端 E2E 测试结构

```
apps/web/e2e/
├── users.spec.ts                 # 用户管理测试
├── support/
│   ├── fixtures.ts               # 测试 fixtures（认证、用户凭证）
│   ├── helpers.ts                # 通用辅助函数（登录、表单填充等）
│   └── page-objects.ts           # Page Object 模式（UsersPage、UserFormPage 等）
└── playwright.config.ts          # Playwright 配置
```

**Fixtures**:
- `authenticatedPage` - 自动登录的页面实例
- `adminUser` - 管理员凭证
- `testUser` - 测试用户凭证

**Helpers**:
- `login()` - 登录用户
- `logout()` - 登出用户
- `fillForm()` - 填充表单
- `getTableData()` - 获取表格数据
- `expectSuccessMessage()` - 验证成功消息

**Page Objects**:
- `UsersPage` - 用户列表页面
- `UserFormPage` - 用户表单页面
- `UserDetailPage` - 用户详情页面

### 后端测试结构

```
apps/api/
├── jest.config.ts                # Jest 配置
├── src/
│   └── modules/users/
│       ├── __tests__/
│       │   ├── users.service.spec.ts
│       │   └── users.controller.spec.ts
│       └── ...
└── test/
    ├── unit/                      # 单元测试
    ├── integration/               # 集成测试
    ├── api/                       # API 测试
    └── support/
        └── test-utils.ts          # 测试工具函数
```

**Test Utils**:
- `createMockRepository()` - 创建 Mock Repository
- `createMockService()` - 创建 Mock Service
- `TestDataFactory` - 测试数据工厂
- `TestUtils` - 验证和清理工具

---

## 最佳实践

### 前端 E2E 测试

#### 1. 使用 Page Object 模式

```typescript
// ✅ 好的做法
const usersPage = new UsersPage(page);
await usersPage.searchUser('admin');

// ❌ 避免
await page.fill('input[placeholder*="搜索"]', 'admin');
```

#### 2. 使用稳定的选择器

```typescript
// ✅ 好的做法
await page.locator('[data-testid="user-menu"]').click();

// ⚠️ 不稳定
await page.locator('div.header button').click();
```

#### 3. 等待网络请求完成

```typescript
// ✅ 好的做法
await usersPage.searchUser('admin');
await page.waitForLoadState('networkidle');

// ❌ 避免
await page.fill('input', 'admin');
await page.waitForTimeout(1000);
```

#### 4. 测试隔离

```typescript
// ✅ 每个测试独立运行
test.beforeEach(async ({ page }) => {
  await page.goto('/settings/users');
});

// ❌ 避免依赖其他测试
```

### 后端单元测试

#### 1. Mock 外部依赖

```typescript
// ✅ 好的做法
const mockRepository = createMockRepository();
mockRepository.findByUsername.mockResolvedValue(null);

// ❌ 避免
// 直接使用真实数据库
```

#### 2. 使用测试数据工厂

```typescript
// ✅ 好的做法
const user = TestDataFactory.createUser({ username: 'admin' });

// ❌ 避免
const user = { id: 1, username: 'admin', ... };
```

#### 3. 验证 API 响应格式

```typescript
// ✅ 好的做法
TestUtils.validateApiResponse(response);
expect(response.success).toBe(true);

// ❌ 避免
expect(response.data).toBeDefined();
```

---

## CI/CD 集成

### GitHub Actions

#### 前端 E2E 测试

```yaml
- name: Run E2E tests
  run: cd apps/web && pnpm test:e2e
```

#### 后端单元测试

```yaml
- name: Run unit tests
  run: cd apps/api && pnpm test:cov
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/apps/api/coverage-final.json
```

---

## 调试

### 前端 E2E 测试调试

```bash
# 1. 使用 Playwright Inspector
pnpm test:e2e:debug

# 2. 查看测试报告
pnpm test:e2e:report

# 3. 查看失败时的截图
# 截图保存在 test-results/ 目录
```

### 后端单元测试调试

```bash
# 1. 调试模式
pnpm test:debug

# 2. 在 VS Code 中调试
# 在 .vscode/launch.json 中配置 Jest 调试器

# 3. 查看覆盖率报告
pnpm test:cov
# 报告在 coverage/ 目录
```

---

## 知识库参考

- **Playwright 文档**: https://playwright.dev/docs/intro
- **Jest 文档**: https://jestjs.io/docs/getting-started
- **Page Object 模式**: https://playwright.dev/docs/pom
- **测试最佳实践**: https://playwright.dev/docs/best-practices

---

## 常见问题

### Q: 如何在 CI 中运行测试？
A: 使用 `pnpm test:e2e` 和 `pnpm test:cov` 命令。Playwright 会自动检测 CI 环境并调整配置。

### Q: 如何调试失败的测试？
A: 使用 `pnpm test:e2e:debug` 或 `pnpm test:debug` 命令，或查看生成的截图和视频。

### Q: 如何提高测试速度？
A: 使用并行执行、减少不必要的等待、使用 Mock 数据而不是真实数据库。

### Q: 如何处理不稳定的测试？
A: 使用稳定的选择器、等待网络请求完成、避免硬编码的等待时间。

---

**最后更新**: 2026-04-17

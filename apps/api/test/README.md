# 后端测试指南

## 快速开始

### 运行测试

```bash
cd apps/api

# 运行所有测试
pnpm test

# 监视模式（自动重新运行）
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov

# 调试模式
pnpm test:debug

# 运行特定测试文件
pnpm test users.service.spec.ts

# 运行特定测试套件
pnpm test -- --testNamePattern="UsersService"
```

---

## 测试结构

### 目录布局

```
apps/api/
├── src/
│   └── modules/users/
│       ├── __tests__/
│       │   ├── users.service.spec.ts      # Service 单元测试
│       │   └── users.controller.spec.ts   # Controller 集成测试
│       ├── users.service.ts
│       ├── users.controller.ts
│       └── ...
├── test/
│   ├── unit/                              # 单元测试
│   ├── integration/                       # 集成测试
│   ├── api/                               # API 测试
│   └── support/
│       └── test-utils.ts                  # 测试工具函数
└── jest.config.ts
```

### 测试类型

#### 单元测试 (Unit Tests)

- 测试单个函数或方法
- Mock 所有外部依赖
- 快速执行
- 位置: `src/**/__tests__/*.spec.ts`

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  it('should create a user', async () => {
    // Arrange
    const createUserDto = { username: 'test', name: 'Test', password: 'pass' };
    repository.findByUsername.mockResolvedValue(null);
    repository.create.mockResolvedValue({ id: 1, ...createUserDto });

    // Act
    const result = await service.create(createUserDto, 'admin');

    // Assert
    expect(result.id).toBe(1);
    expect(repository.create).toHaveBeenCalled();
  });
});
```

#### 集成测试 (Integration Tests)

- 测试多个组件的交互
- 使用真实数据库或 TestingModule
- 较慢但更全面
- 位置: `test/integration/*.spec.ts`

```typescript
describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [UsersModule, DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    usersService = moduleFixture.get(UsersService);
  });

  it('POST /users should create a user', async () => {
    const createUserDto = { username: 'test', name: 'Test', password: 'pass' };

    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(createUserDto)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });
});
```

---

## 测试工具

### Mock Repository

```typescript
import { createMockRepository } from '../test/support/test-utils';

const mockRepository = createMockRepository();
mockRepository.findByUsername.mockResolvedValue(null);
mockRepository.create.mockResolvedValue({ id: 1, username: 'test' });
```

### 测试数据工厂

```typescript
import { TestDataFactory } from '../test/support/test-utils';

// 创建单个用户
const user = TestDataFactory.createUser({ username: 'admin' });

// 创建多个用户
const users = TestDataFactory.createUsers(5);

// 创建 JWT Token
const token = TestDataFactory.createJwtToken(1, 'admin');
```

### 测试工具函数

```typescript
import { TestUtils } from '../test/support/test-utils';

// 验证 API 响应格式
TestUtils.validateApiResponse(response);

// 验证分页响应
TestUtils.validatePaginatedResponse(response);

// 清理数据库
await TestUtils.cleanDatabase(app, [User, Role]);

// 等待异步操作
await TestUtils.wait(1000);
```

---

## 最佳实践

### 1. 测试隔离

```typescript
// ✅ 好的做法
beforeEach(async () => {
  // 每个测试前重新创建 module
  const module = await Test.createTestingModule({...}).compile();
});

// ❌ 避免
// 在多个测试间共享状态
```

### 2. 清晰的测试结构 (AAA Pattern)

```typescript
// ✅ 好的做法
it('should create a user', async () => {
  // Arrange - 准备测试数据
  const createUserDto = { username: 'test', name: 'Test', password: 'pass' };
  
  // Act - 执行操作
  const result = await service.create(createUserDto, 'admin');
  
  // Assert - 验证结果
  expect(result.id).toBeDefined();
});

// ❌ 避免
it('should create a user', async () => {
  const result = await service.create({...}, 'admin');
  expect(result.id).toBeDefined();
});
```

### 3. 有意义的测试名称

```typescript
// ✅ 好的做法
it('should throw BadRequestException when username already exists', async () => {
  // ...
});

// ❌ 避免
it('should throw error', async () => {
  // ...
});
```

### 4. 避免测试间的依赖

```typescript
// ✅ 好的做法
describe('UsersService', () => {
  let service: UsersService;
  
  beforeEach(async () => {
    // 每个测试都有独立的 service 实例
    service = new UsersService(mockRepository);
  });
  
  it('test 1', async () => { ... });
  it('test 2', async () => { ... });
});

// ❌ 避免
describe('UsersService', () => {
  let service: UsersService;
  
  beforeAll(async () => {
    // 所有测试共享同一个实例
    service = new UsersService(mockRepository);
  });
});
```

### 5. 覆盖率目标

```typescript
// jest.config.ts
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
};
```

---

## 调试

### VS Code 调试配置

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 命令行调试

```bash
# 调试模式
pnpm test:debug

# 运行单个测试文件
pnpm test users.service.spec.ts

# 运行匹配的测试
pnpm test -- --testNamePattern="should create"
```

---

## CI/CD 集成

### GitHub Actions

```yaml
- name: Run unit tests
  run: cd apps/api && pnpm test:cov

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/apps/api/coverage-final.json
    flags: backend
```

---

## 常见问题

### Q: 如何 Mock 数据库？
A: 使用 `createMockRepository()` 函数创建 Mock Repository，然后在 TestingModule 中注入。

### Q: 如何测试异步代码？
A: 使用 `async/await` 或返回 Promise。Jest 会自动等待 Promise 解决。

### Q: 如何测试错误处理？
A: 使用 `expect().rejects.toThrow()` 或 `expect().toThrow()`。

### Q: 如何提高测试速度？
A: 使用 Mock 而不是真实数据库、并行运行测试、避免不必要的等待。

---

**最后更新**: 2026-04-17

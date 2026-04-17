import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * 测试数据库配置
 * 用于集成测试
 */
export const getTestDatabaseConfig = () => ({
  type: 'mysql' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '3306'),
  username: process.env.TEST_DB_USERNAME || 'root',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_NAME || 'infitek_erp_test',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  dropSchema: true,
});

/**
 * 创建测试应用
 */
export async function createTestApp(imports: any[]): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports,
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  return app;
}

/**
 * 创建 Mock Repository
 */
export function createMockRepository<T>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    query: jest.fn(),
  };
}

/**
 * 创建 Mock Service
 */
export function createMockService<T>(methods: string[]): Record<string, jest.Mock> {
  const mock: Record<string, jest.Mock> = {};
  methods.forEach((method) => {
    mock[method] = jest.fn();
  });
  return mock;
}

/**
 * 测试数据工厂
 */
export class TestDataFactory {
  /**
   * 创建测试用户
   */
  static createUser(overrides?: Partial<any>) {
    return {
      id: 1,
      username: 'testuser',
      name: 'Test User',
      password: 'hashed_password',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'admin',
      updated_by: 'admin',
      ...overrides,
    };
  }

  /**
   * 创建多个测试用户
   */
  static createUsers(count: number, overrides?: Partial<any>) {
    return Array.from({ length: count }, (_, i) =>
      this.createUser({
        id: i + 1,
        username: `user${i + 1}`,
        name: `User ${i + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * 创建测试 JWT Token
   */
  static createJwtToken(userId: number = 1, username: string = 'testuser') {
    // 这是一个示例 token，实际应该使用 JwtService 生成
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
  }
}

/**
 * 测试工具函数
 */
export class TestUtils {
  /**
   * 等待异步操作完成
   */
  static async wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理数据库
   */
  static async cleanDatabase(app: INestApplication, entities: any[]) {
    const dataSource = app.get('DataSource');
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity);
      await repository.query(`TRUNCATE TABLE ${repository.metadata.tableName}`);
    }
  }

  /**
   * 验证 API 响应格式
   */
  static validateApiResponse(response: any) {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('code');
  }

  /**
   * 验证分页响应
   */
  static validatePaginatedResponse(response: any) {
    this.validateApiResponse(response);
    expect(response.data).toHaveProperty('items');
    expect(response.data).toHaveProperty('total');
    expect(response.data).toHaveProperty('page');
    expect(response.data).toHaveProperty('pageSize');
  }
}

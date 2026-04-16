# Story 1.1: Monorepo 项目初始化与开发环境搭建

Status: ready-for-dev

## Story

As a 开发者,
I want 完整的 pnpm Monorepo 项目脚手架（apps/api + apps/web + packages/shared）已就绪，含数据库连接、Docker 编排和基础开发命令,
So that 我可以在统一的项目结构中开发前后端代码，一条命令启动开发环境。

## Acceptance Criteria

**AC1 — 开发启动**
- Given 开发者克隆代码仓库
- When 执行 `pnpm install && pnpm dev`
- Then 前端 Vite 开发服务器和后端 NestJS 服务同时启动
- And 后端成功连接 MySQL 数据库

**AC2 — 项目目录结构**
- Given 项目结构已初始化
- When 查看目录结构
- Then 存在 `apps/api`（NestJS 11）、`apps/web`（React 19 + Vite 6）、`packages/shared` 三个工作区
- And `packages/shared` 包含 `src/enums/` 和 `src/types/` 目录及 `index.ts` 导出入口
- And `pnpm-workspace.yaml` 正确配置 `apps/*` 和 `packages/*`

**AC3 — Docker Compose**
- Given Docker Compose 配置已就绪
- When 执行 `docker-compose up`
- Then api、web、mysql 三个容器正常启动并互联
- And mysql 容器挂载了数据卷用于持久化

**AC4 — 后端基础配置**
- Given 后端项目已配置
- When 查看后端代码
- Then `BaseEntity` 已定义（含 `id`, `created_at`, `updated_at`, `created_by`, `updated_by`）
- And TypeORM 数据源配置使用 `.env` 文件，`synchronize: false`，`connectionLimit: 20`
- And 第一个空的 TypeORM Migration 文件存在
- And `tsconfig.base.json` 在 workspace 根目录配置共享的 TypeScript 基础选项

## Tasks / Subtasks

- [ ] 任务 1：初始化 pnpm Workspace 根目录 (AC: 1, 2)
  - [ ] 创建根目录 `infitek-erp/`，执行 `pnpm init`
  - [ ] 创建 `pnpm-workspace.yaml`（`apps/*` + `packages/*`）
  - [ ] 创建根目录 `package.json` 并添加 `"dev"` 脚本（并行启动前后端）
  - [ ] 创建 `tsconfig.base.json`（共享 TS 基础配置）
  - [ ] 创建 `.gitignore`、`.env.example`、`README.md`

- [ ] 任务 2：创建后端 NestJS 应用 `apps/api` (AC: 1, 2, 4)
  - [ ] 使用 `pnpm dlx @nestjs/cli new api --package-manager pnpm` 初始化
  - [ ] 安装核心依赖（见"依赖清单"）
  - [ ] 创建 `src/common/entities/base.entity.ts`（BaseEntity，含 5 个字段）
  - [ ] 创建 `src/config/database.config.ts`（TypeORM 连接配置，`synchronize: false`，`connectionLimit: 20`）
  - [ ] 在 `app.module.ts` 注册 `TypeOrmModule.forRootAsync`
  - [ ] 生成第一个空 Migration 文件（`pnpm typeorm migration:create`）
  - [ ] 创建 `.env.example` 并列出所有必需环境变量
  - [ ] 创建 `Dockerfile`（多阶段构建）

- [ ] 任务 3：创建前端 Vite + React 应用 `apps/web` (AC: 1, 2)
  - [ ] 使用 `pnpm create vite web --template react-ts` 初始化
  - [ ] 安装核心依赖（见"依赖清单"）
  - [ ] 创建基础目录结构：`src/pages/`、`src/components/`、`src/api/`、`src/store/`
  - [ ] 创建 `src/api/request.ts`（axios 实例占位，拦截器留空，Story 1.2/1.5 补全）
  - [ ] 配置 `vite.config.ts`（API 代理 `/api` → `http://localhost:3000`）

- [ ] 任务 4：创建共享类型包 `packages/shared` (AC: 2)
  - [ ] 创建 `packages/shared/` 目录，执行 `pnpm init`，包名 `@infitek/shared`
  - [ ] 创建 `src/enums/` 目录，放入以下枚举占位文件：
    - `sales-order-status.enum.ts`
    - `purchase-order-status.enum.ts`
    - `shipping-demand-status.enum.ts`
    - `logistics-order-status.enum.ts`
  - [ ] 创建 `src/types/` 目录：
    - `pagination.types.ts`（`PaginationResult<T>` 类型）
    - `api-response.types.ts`（`ApiResponse<T>` 类型）
  - [ ] 创建 `src/index.ts`（统一导出所有枚举和类型）
  - [ ] 创建 `tsconfig.json`（继承根 `tsconfig.base.json`）

- [ ] 任务 5：配置 Docker Compose (AC: 3)
  - [ ] 创建根目录 `docker-compose.yml`（api + web + mysql 三容器）
  - [ ] MySQL 容器配置数据卷持久化（`db_data:/var/lib/mysql`）
  - [ ] 配置容器间网络互联
  - [ ] api 和 web 容器引用各自 `Dockerfile`

- [ ] 任务 6：验证整体运行 (AC: 1, 3, 4)
  - [ ] 执行 `pnpm install` 验证依赖正确安装
  - [ ] 配置 `.env` 后执行 `pnpm dev`，确认前后端同时启动
  - [ ] 验证后端日志中出现数据库连接成功信息
  - [ ] 执行 `docker-compose up` 验证三容器正常启动

## Dev Notes

### 依赖清单

**后端 `apps/api`（追加到 NestJS 默认依赖之上）：**
```bash
pnpm add @nestjs/typeorm typeorm mysql2 @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/swagger swagger-ui-express class-validator class-transformer
pnpm add -D @types/passport-jwt
```

**前端 `apps/web`（追加到 Vite 默认依赖之上）：**
```bash
pnpm add antd @ant-design/icons @ant-design/pro-components axios @tanstack/react-query react-router-dom zustand dayjs
```

**根目录 `package.json` scripts：**
```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter=./apps/* dev",
    "build": "pnpm --parallel --filter=./apps/* build"
  }
}
```

### BaseEntity 定义（必须完全遵循）

文件路径：`apps/api/src/common/entities/base.entity.ts`

```typescript
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column, DeleteDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  @Expose()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Expose()
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  @Expose()
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  @Expose()
  updatedBy: string;
}
```

> 注：`@DeleteDateColumn` 用于需要软删除的实体，不在 BaseEntity 中默认添加，各模块按需继承后添加。

### TypeORM 数据库配置（必须完全遵循）

文件路径：`apps/api/src/config/database.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,       // 生产环境禁止！
  extra: { connectionLimit: 20 },
}));
```

**必需环境变量（`.env.example`）：**
```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=infitek_erp

# JWT（Story 1.3 使用）
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=8h

# OSS（Story 1.6 使用）
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=infitek-erp-files

# 应用
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### packages/shared 关键类型定义

文件：`packages/shared/src/types/api-response.types.ts`
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code: string;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

文件：`packages/shared/src/types/pagination.types.ts`
```typescript
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}
```

### Docker Compose 结构

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASS}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

  api:
    build: ./apps/api
    environment:
      DB_HOST: mysql
      # 其余环境变量从 .env 注入
    ports:
      - "3000:3000"
    depends_on:
      - mysql

  web:
    build: ./apps/web
    ports:
      - "5173:5173"
    depends_on:
      - api

volumes:
  db_data:
```

### tsconfig.base.json（根目录）

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 项目结构注意事项

- **根包名**：`package.json` 中 `name` 设为 `infitek-erp`，`private: true`
- **shared 包引用**：`apps/api` 和 `apps/web` 的 `package.json` 中通过 `"@infitek/shared": "workspace:*"` 引用
- **Story 边界**：本 Story 仅建框架，不实现任何业务逻辑；`main.ts` 只做最基础启动，不注册拦截器/守卫（这些在 Story 1.2 完成）
- **Migration 文件**：第一个 migration 文件为空（无 `up`/`down` 逻辑），仅验证 migration 系统可用
- **React Router**：`apps/web` 中仅安装 react-router-dom 依赖，不创建路由配置（Story 1.5 完成）

### 执行规范（架构强制要求，来源：architecture.md#执行规范）

- 所有实体必须继承 `BaseEntity`
- 数据库命名：表名复数 snake_case，列名 snake_case，外键 `{实体}_id`
- `synchronize: false` 永远不得改为 `true`
- **ClassSerializer 三件套**（Story 1.2+ 中强制配置）：`ClassSerializerInterceptor` 全局注册 + Entity 字段 `@Expose()` + `@Column` 用 `name` 参数指定 snake_case 列名

### Project Structure Notes

- 本 Story 创建的目录树需严格对应架构文档 `architecture.md#完整项目目录树`
- `apps/api/src/modules/` 目录在本 Story 中创建空目录即可，各业务模块在后续 Story 中逐步填充
- `apps/api/src/common/` 目录结构：`entities/`、`guards/`、`interceptors/`、`filters/`、`decorators/`、`dto/`（Story 1.2 填充）

### References

- 架构决策：[Source: architecture.md#技术栈选型]
- 项目结构：[Source: architecture.md#完整项目目录树]
- BaseEntity 设计：[Source: architecture.md#数据架构]
- 数据库连接池配置：[Source: architecture.md#基础设施与部署]
- 执行规范：[Source: architecture.md#执行规范]
- 初始化命令参考：[Source: architecture.md#初始化命令]
- Story 需求：[Source: epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

# Infitek ERP

基于 pnpm Monorepo 的企业 ERP 系统。

## 项目结构

```
infitek-erp/
├── apps/
│   ├── api/          # NestJS 后端
│   └── web/          # React + Vite 前端
├── packages/
│   └── shared/       # 共享类型与枚举
├── pnpm-workspace.yaml
├── package.json
└── docker-compose.yml
```

## 快速开始

### 前置条件：启动 MySQL

后端依赖 MySQL 8，本地开发有两种方式：

**方式一：Docker（推荐，无需本地安装 MySQL）**

```bash
# 仅启动 MySQL 容器（不含 api/web）
docker compose up mysql -d
```

**方式二：本地 MySQL**

确保本机 MySQL 8 已启动并监听 `localhost:3306`，然后手动创建数据库：

```sql
CREATE DATABASE infitek_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 开发模式

```bash
# 安装依赖
pnpm install

# 复制并配置环境变量（必须先完成上方 MySQL 前置条件）
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env，填入实际的 DB_PASS、JWT_SECRET 等

# 启动开发服务器（前后端并行）
pnpm dev
```

> **注意**：若后端报 `ECONNREFUSED 127.0.0.1:3306`，说明 MySQL 未启动或 `.env` 配置有误，请先完成上方前置条件。

### Docker Compose（全栈）

```bash
# 复制根目录环境变量
cp .env.example .env
# 编辑 .env 填入 DB_PASS、JWT_SECRET 等

docker compose up
```

## 技术栈

- **后端**: NestJS 11 + TypeORM + MySQL
- **前端**: React 19 + Vite 6 + Ant Design
- **共享**: TypeScript 共享类型包

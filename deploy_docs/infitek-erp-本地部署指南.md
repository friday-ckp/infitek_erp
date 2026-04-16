# 本地开发环境部署指南

## 前置要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 20 | 推荐使用 nvm 管理 |
| pnpm | >= 9 | `npm install -g pnpm` |
| Docker Desktop | >= 24 | 仅方式二（全容器）需要 |
| Git | 任意 | |

---

## 方式一：纯本地开发（推荐）

### 第一步：克隆仓库

```bash
git clone https://github.com/friday-ckp/infitek_erp.git
cd infitek_erp
```

### 第二步：安装依赖

```bash
pnpm install
```

### 第三步：配置环境变量

```bash
cp apps/api/.env.example apps/api/.env
```

编辑 `apps/api/.env`，填入你的数据库连接信息：

```dotenv
# 数据库（填入你已有的数据库地址）
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=infitek_erp

# JWT（当前 Story 1.1 阶段可随意填写）
JWT_SECRET=dev_secret_change_in_prod
JWT_EXPIRES_IN=8h

# 应用
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

> **提示：** 数据库 `infitek_erp` 需要提前在你的 MySQL 实例中手动创建：
> ```sql
> CREATE DATABASE infitek_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> ```

### 第五步：启动开发服务器

```bash
pnpm dev
```

启动成功后：

| 服务 | 地址 |
|------|------|
| 后端 API | http://localhost:3000 |
| 前端页面 | http://localhost:5173 |

### 验证是否正常

```bash
# 后端健康检查
curl http://localhost:3000

# 预期返回：Hello World!
```

---

## 常见问题

### MySQL 连接失败

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决：** MySQL 还未就绪，等待 10-20 秒后重启后端。

```bash
# 检查 MySQL 状态
docker ps | grep mysql

# 查看 MySQL 日志
docker logs infitek-mysql
```

### 端口被占用

```
Error: listen EADDRINUSE :::3000
```

**解决：** 找到并结束占用进程：

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### pnpm install 失败

**解决：** 确认 pnpm 版本 >= 9，并清除缓存重试：

```bash
pnpm --version
pnpm store prune
pnpm install
```

### 前端无法请求后端 API

前端 Vite 已配置代理：`/api/*` 自动转发到 `http://localhost:3000`。确认后端已启动在 3000 端口即可。

---

## 目录结构速览

```
infitek_erp/
├── apps/
│   ├── api/          # NestJS 11 后端
│   └── web/          # React 19 + Vite 6 前端
├── packages/
│   └── shared/       # 共享枚举和类型（@infitek/shared）
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

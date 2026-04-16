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

### 开发模式

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 启动开发服务器（前后端并行）
pnpm dev
```

### Docker Compose

```bash
docker-compose up
```

## 技术栈

- **后端**: NestJS 11 + TypeORM + MySQL
- **前端**: React 19 + Vite 6 + Ant Design
- **共享**: TypeScript 共享类型包

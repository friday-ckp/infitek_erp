---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-14'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
  - _bmad-output/planning-artifacts/product-brief-infitek_erp.md
  - _bmad-output/planning-artifacts/project-roadmap.md
  - _bmad-output/planning-artifacts/research/domain-星辰科技ERP业务痛点-research-2026-04-10.md
  - docs/星辰系统设计文档.md
  - docs/系统模块清单.md
  - docs/系统模块对应字段清单.md
  - docs/companyInfo.md
  - docs/flow/01-系统全局主流程.md
  - docs/flow/02-销售订单详细流程.md
  - docs/flow/03-采购全流程.md
  - docs/flow/04-仓库作业流程.md
  - docs/flow/05-物流配送流程.md
  - docs/flow/06-库存管理流程.md
  - docs/flow/07-财务应收应付流程.md
  - docs/flow/08-单据关联关系总览.md
  - docs/flow/09-订单状态机.md
workflowType: 'architecture'
project_name: 'infitek_erp'
user_name: 'friday'
date: '2026-04-14'
---

# 架构决策文档 — infitek_erp

_本文档通过逐步协作发现构建。各章节随架构决策推进逐步追加。_

## 项目上下文分析

### 需求概览

**功能需求：**

共 49 条 FR，分布于 6 个业务域：

| 业务域 | FR 数量 | 核心架构意涵 |
|--------|--------|------------|
| 主数据（产品体系） | FR01-FR06 | 三级分类树 + SPU/SKU 层级关联 |
| 主数据（供应链参考） | FR07-FR11 | 供应商-品类关联，合同条款范本 |
| 主数据（客户/公司主体） | FR12-FR13 | 多公司主体签约场景 |
| 主数据（基础参考数据） | FR14-FR17 | 启用/禁用软删除模式 |
| 搜索与查询 | FR18-FR20 | 全模块搜索 + 分页，横切关注 |
| 销售订单 | FR21-FR25 | 状态机（草稿→已确认→已发货）+ 自动生成发货需求 |
| 发货需求与物流 | FR26-FR34 | 核心枢纽：库存锁定、串联采购/物流/出库 |
| 采购订单 | FR35-FR38 | 状态机 + 预填来源链路 |
| 库存管理 | FR39-FR49 | 三字段库存、原子更新、流水记录、锁定/释放逻辑 |

**非功能需求（架构决策驱动）：**

| NFR | 指标 | 架构影响 |
|-----|------|---------|
| NFR-P3 搜索响应 | < 1s | 数据库索引策略、可能需要搜索优化 |
| NFR-P5 库存写操作 | < 3s | 事务设计、避免长锁 |
| NFR-R1 可用性 | 99% | 部署策略（进程守护/健康检查） |
| NFR-R2 每日备份 | 自动 | 备份机制纳入运维设计 |
| NFR-S1 HTTPS | 全链路 | TLS 终止点设计 |
| NFR-S2 密码存储 | 不可逆加密 | bcrypt/Argon2 选型 |
| NFR-S3 自动登出 | 8h 可配置 | Session/Token 过期策略 |
| NFR-S4 接口鉴权 | 全接口 | 认证中间件覆盖所有路由 |
| NFR-U1 浏览器支持 | Chrome/Edge 最新 2 版 | 无需过多 polyfill，可用现代 API |
| NFR-U3 库存不足提示 | 显示可用量 | 前端错误处理需携带业务数据 |

**规模与复杂度：**

- 主要技术域：全栈 Web 应用（桌面浏览器优先）
- 复杂度等级：**企业级（High）**
- 预计核心实体：21+ 个（15 主数据 + 6 交易单据）
- 单租户内部系统，独立部署

### 技术约束与依赖

- **Brownfield 上下文**：替换宜搭 ERP，迁移路径以"主数据先行"为原则
- **无外部集成（MVP）**：系统独立运行，无 CRM/ERP 对接依赖
- **无 RBAC（MVP）**：所有登录用户享有全系统操作权限
- **无移动端**：仅需支持桌面浏览器
- **技术栈**：由架构设计阶段决定，PRD 无约束
- **数据迁移**：期初库存需支持手工录入；主数据批量导入列为 Post-MVP

### 横切关注点

| 关注点 | 受影响模块 | 优先级 |
|--------|----------|--------|
| **库存并发原子性** | 库存管理、发货需求、收货入库、发货出库 | 关键 |
| **单据链路完整性** | 销售→发货需求→采购/物流→出库 | 关键 |
| **状态机一致性** | 销售订单、采购订单、发货需求、物流单 | 高 |
| **审计字段标准化** | 全部 21+ 实体（created_at/updated_at/created_by/updated_by） | 高 |
| **CRUD 组件复用** | 15 类主数据（列表/详情/表单三态） | 高 |
| **搜索与分页** | 全部列表页 | 中 |
| **用户友好错误处理** | 全部用户操作入口（特别是库存校验） | 中 |

## 启动模板评估

### 主要技术域

全栈企业 Web 应用（桌面浏览器优先），数据密集型，复杂状态机 + 库存并发场景

### 技术栈选型

| 层级 | 选型 | 版本 |
|------|------|------|
| 后端框架 | NestJS | 11.x |
| ORM | TypeORM + `@nestjs/typeorm` | 0.3.x / 11.0.x |
| 数据库 | MySQL | 8.x |
| 前端框架 | React + TypeScript | 19.x |
| 构建工具 | Vite | 6.x |
| UI 组件库 | Ant Design | 5.x |
| HTTP 客户端 | Axios + TanStack Query | 1.x / 5.x |
| 认证 | JWT（NestJS Passport） | — |
| 包管理 | pnpm Workspace | 9.x |
| 部署 | Docker + Docker Compose | — |

### 项目结构（pnpm Monorepo）

```
infitek-erp/                     ← pnpm workspace 根目录
├── apps/
│   ├── api/                     ← NestJS 11 后端
│   │   ├── src/
│   │   │   ├── modules/         ← 按业务域（products/sales/inventory/...）
│   │   │   ├── common/          ← 认证守卫、拦截器、异常过滤
│   │   │   └── main.ts
│   │   └── package.json
│   └── web/                     ← Vite + React 19 前端
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   └── main.tsx
│       └── package.json
├── packages/
│   └── shared/                  ← 共享 TypeScript 类型（DTO/枚举/状态机常量）
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

### 初始化命令

```bash
# 初始化 workspace
mkdir infitek-erp && cd infitek-erp
pnpm init
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# 后端
mkdir -p apps && cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm
cd api && pnpm add @nestjs/typeorm typeorm mysql2 @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/swagger

# 前端
cd .. && pnpm create vite web --template react-ts
cd web && pnpm add antd @ant-design/icons @ant-design/pro-components axios @tanstack/react-query react-router-dom

# 共享类型包
mkdir -p ../packages/shared && cd ../packages/shared && pnpm init
```

### 架构决策（由选型确定）

- **类型共享**：`packages/shared` 发布 DTO/枚举/状态机常量，前后端同时引用，零重复定义
- **API 文档**：NestJS Swagger 自动生成 OpenAPI 文档，便于前端对照开发
- **认证**：JWT + NestJS Passport Guard 覆盖全接口（满足 NFR-S4）
- **库存并发**：TypeORM 事务 + `SELECT ... FOR UPDATE` 行锁（满足 NFR-P5 < 3s）
- **统一错误格式**：`{ code, message, data }` 响应体，前端 axios 拦截器全局处理
- **开发启动**：根目录一条命令同时启动前后端 `pnpm dev`
- **部署**：`docker-compose.yml` 编排 api + web + mysql 三个容器

**注：** 项目初始化（monorepo scaffold + 依赖安装）应作为第一个实现故事。

## 核心架构决策

### 决策优先级分析

**关键决策（阻断实现）：**
- 库存写操作必须使用数据库事务 + 行锁（TypeORM QueryRunner + SELECT FOR UPDATE）
- JWT 全局守卫 + 白名单模式（`/auth/login` 豁免），覆盖所有接口
- 统一响应体格式 `{ success, data, message, code }` 须在首个 API 实现前确立

**重要决策（塑造架构）：**
- pnpm Monorepo 类型共享策略（`packages/shared`）
- Offset 分页标准（`page` + `pageSize`）
- 软删除统一使用 `@DeleteDateColumn`

**推迟决策（Post-MVP）：**
- Redis 缓存层（MVP 阶段数据量不触发性能瓶颈）
- CI/CD 流水线（MVP 阶段手动部署）
- 国际化（系统为中文单语言）

---

### 数据架构

| 决策项 | 选定方案 | 版本 | 理由 |
|--------|---------|------|------|
| 实体定义 | TypeORM Entity（`@Entity` 装饰器） | TypeORM 0.3.x | 代码即文档，NestJS 原生集成 |
| 数据库迁移 | TypeORM Migrations（显式迁移文件） | — | 生产环境禁用 `synchronize: true`，变更可追溯 |
| 软删除 | `@DeleteDateColumn`（TypeORM 内置） | — | 主数据"停用"语义，数据可恢复 |
| 基础实体 | 全局 `BaseEntity`（`created_at / updated_at / created_by / updated_by`） | — | 所有实体继承，满足审计字段标准化 |
| 搜索索引 | 数据库索引策略（SKU 编号、客户名、单据号等高频搜索字段） | MySQL 8.x | 满足 NFR-P3 搜索 < 1s |
| 缓存 | 暂不引入（Post-MVP） | — | 单租户初期数据量不触发瓶颈 |
| 库存并发 | TypeORM QueryRunner 事务 + `SELECT ... FOR UPDATE` | — | 满足 NFR-P5 库存写操作 < 3s，防止超卖 |

**库存核心实体字段定义（`inventory_records`）：**

```typescript
// apps/api/src/modules/inventory/entities/inventory-record.entity.ts
@Entity('inventory_records')
export class InventoryRecord extends BaseEntity {
  @Column()                       warehouse_id: number       // 仓库 FK
  @Column()                       product_sku_id: number     // SKU FK
  @Column({ type: 'int', default: 0 }) total_quantity: number    // 总量（已入库）
  @Column({ type: 'int', default: 0 }) locked_quantity: number   // 锁定量（已分配给发货需求，尚未出库）
  @Column({ type: 'int', default: 0 }) available_quantity: number // 可用量 = total - locked
  // 所有写操作（锁定/解锁/扣减/增加）必须在 QueryRunner 事务中用 SELECT...FOR UPDATE 后计算，
  // available_quantity 由代码维护，不做数据库级计算列，确保并发安全
}
```

> **规则：** `available_quantity` 由 Service 层在事务内维护。`STOCK_INSUFFICIENT` 错误消息须携带当前 `available_quantity` 值（满足 NFR-U3）。

**影响模块：** 全部 21+ 实体（特别是库存管理、发货需求）

---

### 认证与安全

| 决策项 | 选定方案 | 理由 |
|--------|---------|------|
| Token 策略 | Access Token（8h，无 Refresh Token） | 直接满足 NFR-S3 8h 自动登出，Token 到期即强制登出，实现最简；ERP 内部系统无需 Refresh Token |
| 密码加密 | bcrypt（rounds=12） | 满足 NFR-S2 不可逆存储，rounds=12 为安全/性能平衡点 |
| 接口鉴权 | NestJS `JwtAuthGuard` 全局注册，白名单豁免 `/auth/login` | 满足 NFR-S4 全接口鉴权，无遗漏风险 |
| HTTPS | Nginx 反向代理终止 TLS | 满足 NFR-S1，容器内走 HTTP，TLS 统一在 Nginx 层处理 |
| CORS | `enableCors` 配置前端域名白名单 | 防止未授权跨域请求 |

**影响模块：** `apps/api/src/common/guards/`、`apps/api/src/modules/auth/`

---

### API 与通信模式

| 决策项 | 选定方案 | 理由 |
|--------|---------|------|
| API 前缀 | `/api/v1/` | 版本化，便于后续迭代 |
| 响应体格式 | `{ success: boolean, data: T, message: string, code: string }` | 统一结构，前端 axios 拦截器一处处理所有业务错误 |
| 分页方式 | Offset 分页（`page` + `pageSize`，默认 pageSize=20） | ERP 场景页码跳转需求强，offset 比 cursor 更直观 |
| 错误码 | HTTP 状态码 + 业务 `code` 字段（如 `STOCK_INSUFFICIENT`、`DUPLICATE_SKU`） | 满足 NFR-U3 库存不足提示携带可用量 |
| API 文档 | `@nestjs/swagger` 自动生成，路径 `/api/docs` | 前端开发对照，Postman 可直接导入 |

**影响模块：** `apps/api/src/common/interceptors/`（响应拦截器统一格式）

---

### 前端架构

| 决策项 | 选定方案 | 版本 | 理由 |
|--------|---------|------|------|
| 路由 | React Router v7 | 7.x | 最新稳定版，支持 loader/action 模式 |
| 服务端状态 | TanStack Query v5 | 5.x | 接口缓存、loading/error 状态、乐观更新，避免手写 useEffect 请求 |
| UI 全局状态 | Zustand | 4.x | 轻量，仅管理当前用户信息、侧边栏折叠等全局 UI 状态 |
| UI Pro 组件层 | `@ant-design/pro-components`（ProTable / ProForm / ProLayout / ProDescriptions） | 与 antd 5.x 配套 | ERP 多模块列表/表单/详情场景直接采用 Pro 组件，避免重复实现分页、搜索栏、表单布局逻辑；UX 规范明确要求使用 ProTable 和 ProForm |
| 表单 | Ant Design ProForm（`@ant-design/pro-components`） | 与 antd 5.x 配套 | ProForm 是 antd Form 的超集，支持分组 Card、折叠面板、子表格（ProFormList）等 ERP 复杂表单场景 |
| 组件组织 | `pages/`（页面）+ `components/`（业务复用）+ `ui/`（基础 UI） | — | 清晰分层，CRUD 复用组件集中在 `components/`；UX 规范定义的 7 个自定义组件（FlowProgress、SmartButton、InventoryIndicator 等）放在 `components/business/` |
| 国际化 | 不引入（中文单语言） | — | Post-MVP 按需添加 |

**影响模块：** `apps/web/src/`

---

### 文件存储（阿里云 OSS）

满足 PRD NFR-F1（文件上传及读取使用阿里云 OSS，服务端不在本地磁盘持久化文件）和 NFR-F2（物理删除）。

| 决策项 | 选定方案 | 理由 |
|--------|---------|------|
| 文件存储后端 | 阿里云 OSS（`ali-oss` npm 包） | PRD NFR-F1 明确要求；支持直传（signed URL）和服务端代理上传两种模式 |
| 上传模式 | **服务端代理上传**：前端 → `POST /api/files/upload`（multipart/form-data）→ NestJS → OSS | 统一鉴权、文件类型/大小校验在服务端执行，避免前端直接持有 OSS 密钥 |
| 文件大小限制 | 单文件最大 50 MB（multipart 拦截器 `limits.fileSize`） | 满足产品证书 PDF / 产品说明书 PDF 场景 |
| 允许的 MIME 类型 | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | 证书（PDF/图片）、资料（PDF）场景 |
| OSS Bucket 结构 | `/{env}/{module}/{date}/{uuid}.{ext}` | 例：`/prod/certificates/2026-04/uuid.pdf` |
| 文件删除 | 服务端调用 `ossClient.delete(objectKey)`（物理删除）| 满足 NFR-F2，需二次确认后执行 |
| 文件下载/访问 | 服务端生成有时效的签名 URL（有效期 1 小时）| 避免文件 URL 永久暴露 |

**后端依赖安装：**

```bash
cd apps/api && pnpm add ali-oss @types/ali-oss @nestjs/platform-express multer @types/multer
```

**环境变量（`.env`）：**

```env
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=infitek-erp-files
```

**核心服务接口（`apps/api/src/files/files.service.ts`）：**

```typescript
// 上传：返回 { url, key } 存入数据库
async upload(file: Express.Multer.File, folder: string): Promise<{ url: string; key: string }>

// 获取签名访问 URL
async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string>

// 物理删除
async delete(key: string): Promise<void>
```

**API 端点：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/files/upload` | 上传文件；请求体 `multipart/form-data`，字段名 `file`，查询参数 `folder`（certificates / documents）；返回 `{ key, filename, size }` |
| GET | `/api/files/signed-url?key=xxx` | 获取有时效的签名下载 URL |
| DELETE | `/api/files` | 删除文件；请求体 `{ key: string }` |

**影响模块：** `apps/api/src/files/`（FilesModule，全局注册供 certificates / documents 模块调用）

---

### 基础设施与部署

| 决策项 | 选定方案 | 理由 |
|--------|---------|------|
| 环境配置 | `.env` 文件 + NestJS `@nestjs/config` | 本地 `.env.local`，生产通过容器环境变量注入 |
| 日志 | NestJS 内置 Logger（结构化输出到 stdout） | Docker 日志驱动收集，简单可靠 |
| 健康检查 | `GET /api/health`（返回 DB 连接状态） | 满足 NFR-R1 99% 可用性监控入口 |
| 数据备份 | MySQL 容器 cron 每日 `mysqldump`，挂载到宿主机目录 | 满足 NFR-R2 每日自动备份 |
| CI/CD | 暂不配置（MVP 手动部署） | Post-MVP 按需添加 GitHub Actions |
| 数据库连接池 | `extra.connectionLimit: 20` | 单实例 Docker 部署默认 10 连接在库存并发高峰可能成瓶颈，20 为安全起点 |

**`database.config.ts` 连接池配置示例：**

```typescript
// apps/api/src/config/database.config.ts
export default registerAs('database', () => ({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,         // 生产环境禁止
  extra: { connectionLimit: 20 },
}))
```

---

### 决策影响分析

**实现顺序（依赖关系）：**

1. pnpm Monorepo 初始化 + `packages/shared` 基础类型定义
2. MySQL 8 + TypeORM 连接 + `BaseEntity` + 第一批 Migration
3. 认证模块（`/auth/login`、JWT 守卫、全局注册）
4. 统一响应拦截器 + 错误过滤器（建立 API 通信基础设施）
5. 主数据模块（15 类，CRUD 模板复用）
6. 库存核心逻辑（事务 + 行锁，最高并发风险）
7. 交易单据模块（依赖主数据 + 库存）

**跨组件依赖：**

- `packages/shared` 的枚举/DTO → 前后端同时依赖，**必须最先稳定**
- `BaseEntity` 审计字段 → 全部实体继承，迁移文件生成前必须确立
- `JwtAuthGuard` 全局注册 → 所有模块自动鉴权，无需逐模块添加
- TanStack Query 的 `queryKey` 命名约定 → 需在前端第一个接口实现时约定，避免后期混乱

## 实现模式与一致性规则

### 潜在冲突点识别

共识别 **6 大类** AI Agent 可能产生分歧的区域：命名、结构、格式、通信、错误处理、Loading 状态

---

### 命名模式

**数据库命名（snake_case）：**

| 规则 | 示例 |
|------|------|
| 表名：复数 snake_case | `product_skus`、`sales_orders`、`shipping_demands` |
| 列名：snake_case | `created_at`、`unit_price`、`sku_code` |
| 外键：`{实体}_id` | `sales_order_id`、`product_sku_id` |
| 索引：`idx_{表}_{列}` | `idx_product_skus_sku_code` |
| 主键：`id`（自增 BIGINT） | `id BIGINT UNSIGNED AUTO_INCREMENT`；业务编号（如 `sales_order_no`、`shipping_demand_no`）作为独立字段单独维护，类型 VARCHAR，加唯一索引 |

**API 端点命名（RESTful 复数）：**

| 规则 | 示例 |
|------|------|
| 资源路径：复数 kebab-case | `/api/v1/product-skus`、`/api/v1/sales-orders` |
| 操作路径：动词后置 | `/api/v1/sales-orders/:id/confirm`、`/api/v1/inventory/adjust` |
| 查询参数：camelCase | `?page=1&pageSize=20&skuCode=ABC` |
| 路由参数：`:id` | `/api/v1/product-skus/:id` |

**代码命名：**

| 层级 | 规则 | 示例 |
|------|------|------|
| TypeScript 变量/函数 | camelCase | `salesOrderId`、`getSkuById()` |
| TypeScript 类/接口/类型 | PascalCase | `ProductSku`、`CreateSalesOrderDto` |
| 后端文件 | kebab-case | `product-sku.service.ts`、`create-sales-order.dto.ts` |
| React 组件文件 | PascalCase | `ProductSkuList.tsx`、`SalesOrderForm.tsx` |
| React 组件函数 | PascalCase | `function ProductSkuList()` |
| 枚举（`packages/shared`） | PascalCase 名 + SCREAMING_SNAKE 值 | `SalesOrderStatus.PENDING_CONFIRM` |

---

### 结构模式

**后端模块结构（每个业务域严格一致）：**

```
apps/api/src/modules/sales-orders/
├── sales-orders.module.ts
├── sales-orders.controller.ts
├── sales-orders.service.ts
├── sales-orders.repository.ts
├── entities/
│   └── sales-order.entity.ts
├── dto/
│   ├── create-sales-order.dto.ts
│   ├── update-sales-order.dto.ts
│   └── sales-order-query.dto.ts
└── tests/
    ├── sales-orders.service.spec.ts
    └── sales-orders.controller.spec.ts
```

**前端页面结构（每个模块严格一致）：**

```
apps/web/src/pages/sales-orders/
├── index.tsx          # 列表页（搜索 + 表格 + 分页）
├── detail.tsx         # 详情页（只读）
├── form.tsx           # 新建/编辑页（表单）
└── components/
    ├── SalesOrderTable.tsx
    └── SalesOrderStatusTag.tsx
```

**前端 API 层结构：**

```
apps/web/src/api/
├── request.ts         # axios 实例 + 拦截器
├── sales-orders.api.ts
├── product-skus.api.ts
└── ...（每个模块一个文件）
```

---

### 格式模式

**API 响应统一格式（后端 ResponseInterceptor 强制执行）：**

```typescript
// 成功
{ "success": true, "data": T, "message": "操作成功", "code": "OK" }

// 失败（HttpException 全局过滤器捕获）
{ "success": false, "data": null, "message": "库存不足，当前可用库存：5", "code": "STOCK_INSUFFICIENT" }

// 分页列表
{ "success": true, "data": { "list": T[], "total": number, "page": number, "pageSize": number }, "message": "OK", "code": "OK" }
```

**日期/时间格式：**

| 场景 | 格式 |
|------|------|
| API JSON 传输 | ISO 8601 字符串：`"2026-04-14T09:30:00.000Z"` |
| 数据库存储 | MySQL DATETIME |
| 前端显示 | `dayjs` 格式化为 `YYYY-MM-DD HH:mm` |

**JSON 字段命名：** API 请求与响应均使用 **camelCase**（TypeORM 实体 snake_case，NestJS 序列化时自动转换）

---

### 通信模式

**前端 API 调用约定：**

```typescript
// apps/web/src/api/sales-orders.api.ts
export const salesOrdersApi = {
  list: (params: SalesOrderQueryDto) => request.get('/sales-orders', { params }),
  get: (id: string) => request.get(`/sales-orders/${id}`),
  create: (data: CreateSalesOrderDto) => request.post('/sales-orders', data),
  update: (id: string, data: UpdateSalesOrderDto) => request.patch(`/sales-orders/${id}`, data),
  confirm: (id: string) => request.post(`/sales-orders/${id}/confirm`),
}
```

**TanStack Query queryKey 命名约定：**

```typescript
// 列表：['资源名', 'list', 查询参数对象]
useQuery({ queryKey: ['sales-orders', 'list', queryParams] })
// 详情：['资源名', 'detail', id]
useQuery({ queryKey: ['sales-orders', 'detail', id] })
```

**Zustand Store 命名约定：**

```typescript
// 文件：apps/web/src/store/{功能}.store.ts
// Hook：use{功能}Store
useAuthStore()    // 当前用户信息、token
useLayoutStore()  // 侧边栏折叠等 UI 全局状态
```

---

### 过程模式

**错误处理（后端）：**

```typescript
// 业务异常：NestJS HttpException 子类 + 业务 code
throw new BadRequestException({ code: 'STOCK_INSUFFICIENT', message: `库存不足，当前可用：${available}` })
throw new ConflictException({ code: 'CONCURRENT_UPDATE', message: '并发操作冲突，请重试' })
throw new NotFoundException({ code: 'RECORD_NOT_FOUND', message: '记录不存在' })
```

**错误处理（前端）：**

```typescript
// axios 拦截器统一弹出 antd message，组件层无需重复处理
axiosInstance.interceptors.response.use(
  res => res.data.data,
  err => {
    antdMessage.error(err.response?.data?.message ?? '操作失败')
    return Promise.reject(err.response?.data)
  }
)
```

**Loading 状态：** 统一使用 TanStack Query 的 `isLoading` / `isPending`，禁止在组件内自定义 loading state。

**表单提交模式：**

```typescript
// 标准提交 Pattern：Form.onFinish → mutation → invalidateQueries → navigate
const mutation = useMutation({ mutationFn: salesOrdersApi.create })
const onFinish = async (values) => {
  await mutation.mutateAsync(values)
  queryClient.invalidateQueries({ queryKey: ['sales-orders', 'list'] })
  navigate('/sales-orders')
}
// 按钮：<Button loading={mutation.isPending} htmlType="submit">提交</Button>
```

---

### 执行规范（所有 AI Agent 必须遵守）

- 后端新模块必须包含 7 个文件：`module / controller / service / repository / entity / dto / tests`
- 前端新页面必须包含 3 个入口：`index（列表）/ detail（详情）/ form（表单）`
- 所有实体必须继承 `BaseEntity`（含 4 个审计字段：`created_at / updated_at / created_by / updated_by`）
- 所有列表接口必须支持 `page + pageSize` 分页参数，默认 `pageSize=20`
- 库存写操作（锁定/释放/扣减/增加）必须使用 `QueryRunner` 事务 + `SELECT ... FOR UPDATE`
- 禁止在 React 组件内直接调用 `axios`，必须通过 `apps/web/src/api/` 层函数
- 所有枚举值必须定义在 `packages/shared`，禁止前后端各自独立定义
- 禁止在响应拦截器之外重复弹出错误提示（避免双重 Toast）
- 状态机变更（确认/取消/发货等）必须通过专用动作端点（如 `POST /:id/confirm`），不通过通用 PATCH 端点
- **ClassSerializer 三件套必须同时配置：** `main.ts` 全局注册 `ClassSerializerInterceptor`、所有 Entity 字段标注 `@Expose()`、所有 `@Column` 通过 `name` 参数显式指定 snake_case 列名
- 库存事务遭遇死锁（MySQL Error 1213）时，Service 层须捕获并以指数退避重试最多 3 次；超限后抛出 `ConflictException({ code: 'CONCURRENT_UPDATE' })`，禁止静默重试超过 3 次

### 反模式示例（禁止）

```typescript
// ❌ 禁止：直接在组件内调用 axios
const res = await axios.get('/api/v1/sales-orders')

// ❌ 禁止：前端独立定义枚举
const STATUS = { DRAFT: 'draft', CONFIRMED: 'confirmed' }

// ❌ 禁止：库存操作不用事务
await inventoryRepository.save({ ...inventory, locked: inventory.locked + qty })

// ❌ 禁止：状态变更走通用 PATCH
await request.patch(`/sales-orders/${id}`, { status: 'confirmed' })
```

---

### 测试分层策略

每个模块的 `tests/` 目录须覆盖以下三层，缺一不可：

| 层级 | 文件命名 | 工具 | 覆盖内容 | 关键要求 |
|------|---------|------|---------|---------|
| **单元测试** | `*.service.spec.ts` | Jest + `@nestjs/testing` | Service 业务逻辑（mock Repository） | 状态机转换、库存计算、权限校验逻辑须 100% 覆盖 |
| **集成测试** | `*.controller.spec.ts` | Jest + Supertest + TestModule | Controller 路由、DTO 验证、响应格式 | 使用真实 NestJS Module，mock Service 层 |
| **并发测试** | `inventory-concurrent.spec.ts`（仅库存模块） | Jest + 真实 MySQL（测试 DB） | `SELECT FOR UPDATE` 并发超卖场景 | 10 并发同时锁定同一批次库存，断言最终数量正确 |

**执行命令约定：**

```bash
# 单元 + 集成（CI 必跑）
pnpm test --filter=api

# 并发测试（依赖 Docker 测试 DB，本地按需跑）
pnpm test:concurrent --filter=api
```

**前端测试：** MVP 阶段仅要求关键表单组件（销售订单、库存调整）有渲染快照测试（`*.test.tsx`），使用 Vitest + Testing Library。

## 项目结构与边界

### 完整项目目录树

```
infitek-erp/
├── package.json                      # workspace 根配置（pnpm scripts）
├── pnpm-workspace.yaml               # apps/* + packages/*
├── tsconfig.base.json                # 共享 TS 基础配置
├── docker-compose.yml                # api + web + mysql 三容器编排
├── .env.example                      # 环境变量模板
├── .gitignore
├── README.md
│
├── packages/
│   └── shared/                       # 前后端共享类型包 @infitek/shared
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── enums/
│           │   ├── sales-order-status.enum.ts
│           │   ├── purchase-order-status.enum.ts
│           │   ├── shipping-demand-status.enum.ts
│           │   └── logistics-order-status.enum.ts
│           └── types/
│               ├── pagination.types.ts
│               └── api-response.types.ts
│
└── apps/
    ├── api/                          # NestJS 11 后端
    │   ├── package.json
    │   ├── nest-cli.json
    │   ├── tsconfig.json
    │   ├── .env.example
    │   ├── Dockerfile
    │   └── src/
    │       ├── main.ts
    │       ├── app.module.ts
    │       ├── common/
    │       │   ├── entities/
    │       │   │   └── base.entity.ts
    │       │   ├── guards/
    │       │   │   └── jwt-auth.guard.ts
    │       │   ├── interceptors/
    │       │   │   └── response.interceptor.ts
    │       │   ├── filters/
    │       │   │   └── http-exception.filter.ts
    │       │   ├── decorators/
    │       │   │   └── public.decorator.ts
    │       │   └── dto/
    │       │       └── pagination.dto.ts
    │       ├── config/
    │       │   └── database.config.ts
    │       ├── modules/
    │       │   ├── auth/                         # POST /auth/login
    │       │   ├── users/
    │       │   ├── master-data/
    │       │   │   ├── product-categories/       # FR01
    │       │   │   ├── spus/                     # FR02
    │       │   │   ├── product-skus/             # FR03
    │       │   │   ├── product-library/          # FR06
    │       │   │   ├── product-certificates/     # FR05（含证书有效期预警）
    │       │   │   ├── faqs/                     # FR04
    │       │   │   ├── suppliers/                # FR07
    │       │   │   ├── ports/                    # FR09
    │       │   │   ├── logistics-providers/      # FR10
    │       │   │   ├── contract-templates/       # FR11
    │       │   │   ├── customers/                # FR12
    │       │   │   ├── company-entities/         # FR13
    │       │   │   ├── warehouses/               # FR14
    │       │   │   ├── currencies/               # FR15
    │       │   │   └── countries/                # FR16
    │       │   ├── sales-orders/                 # FR21-FR25（状态机）
    │       │   │   ├── sales-orders.module.ts
    │       │   │   ├── sales-orders.controller.ts
    │       │   │   ├── sales-orders.service.ts
    │       │   │   ├── sales-orders.repository.ts
    │       │   │   ├── entities/
    │       │   │   │   ├── sales-order.entity.ts
    │       │   │   │   └── sales-order-item.entity.ts
    │       │   │   ├── dto/
    │       │   │   └── tests/
    │       │   ├── shipping-demands/             # FR26-FR34（核心枢纽）
    │       │   ├── purchase-orders/              # FR35-FR38（状态机）
    │       │   ├── logistics-orders/             # FR29-FR31
    │       │   └── inventory/                    # FR39-FR49（事务核心）
    │       │       ├── inventory.module.ts
    │       │       ├── inventory.controller.ts
    │       │       ├── inventory.service.ts      # QueryRunner + FOR UPDATE
    │       │       ├── inventory.repository.ts
    │       │       ├── entities/
    │       │       │   ├── inventory-record.entity.ts
    │       │       │   └── inventory-transaction.entity.ts
    │       │       └── dto/
    │       └── migrations/
    │           └── 1744000000000-InitSchema.ts
    │
    └── web/                          # Vite + React 19 前端
        ├── package.json
        ├── vite.config.ts
        ├── tsconfig.json
        ├── index.html
        ├── Dockerfile
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── api/
            │   ├── request.ts                    # axios 实例 + 拦截器
            │   ├── auth.api.ts
            │   ├── product-skus.api.ts
            │   ├── sales-orders.api.ts
            │   ├── shipping-demands.api.ts
            │   ├── purchase-orders.api.ts
            │   ├── inventory.api.ts
            │   └── ...（每模块一个文件）
            ├── store/
            │   ├── auth.store.ts
            │   └── layout.store.ts
            ├── components/
            │   ├── layout/
            │   │   ├── AppLayout.tsx
            │   │   └── Sidebar.tsx
            │   ├── common/
            │   │   ├── PageTable.tsx
            │   │   ├── StatusTag.tsx
            │   │   ├── SearchForm.tsx
            │   │   └── DetailDescriptions.tsx
            │   └── order/
            │       └── OrderStatusTimeline.tsx
            ├── pages/
            │   ├── login/index.tsx
            │   ├── dashboard/index.tsx
            │   ├── master-data/
            │   │   ├── product-categories/
            │   │   │   ├── index.tsx
            │   │   │   └── form.tsx
            │   │   ├── product-skus/
            │   │   │   ├── index.tsx
            │   │   │   ├── detail.tsx
            │   │   │   └── form.tsx
            │   │   └── ...（其余 13 类主数据）
            │   ├── sales-orders/
            │   │   ├── index.tsx
            │   │   ├── detail.tsx
            │   │   └── form.tsx
            │   ├── shipping-demands/
            │   ├── purchase-orders/
            │   └── inventory/
            │       ├── index.tsx
            │       ├── receive.tsx
            │       └── outbound.tsx
            └── router/
                └── index.tsx
```

### 架构边界

**API 边界：**

| 边界 | 规则 |
|------|------|
| 外部入口 | 所有请求经 Nginx → `/api/v1/*` → NestJS |
| 鉴权白名单 | 仅 `POST /api/v1/auth/login` 跳过 JwtAuthGuard |
| 模块隔离 | 每个 NestJS Module 只暴露自身 Service，不直接访问其他模块 Repository |
| 库存写入 | 所有库存变更必须通过 `InventoryService`，不允许其他模块直接操作库存表 |

**数据边界：**

| 边界 | 规则 |
|------|------|
| 主数据只读 | 交易模块通过外键引用主数据，不修改主数据实体 |
| 库存分离 | `inventory_records`（当前量）与 `inventory_transactions`（流水）隔离，流水只追加 |
| 单据链路 | `sales_order → shipping_demand → purchase_order / logistics_order → inventory_transaction`，跨链路仅通过外键引用 |

### FR 到结构映射

| FR 范围 | 后端模块 | 前端页面 |
|---------|---------|---------|
| FR01-FR06 产品体系 | `modules/master-data/product-*` | `pages/master-data/product-*` |
| FR07-FR10 供应链参考（供应商/港口/物流商） | `modules/master-data/suppliers, ports, logistics-providers` | `pages/master-data/suppliers, ports, logistics-providers` |
| FR11 合同条款范本 | `modules/master-data/contract-templates` | `pages/master-data/contract-templates` |
| FR12-FR13 客户/公司主体 | `modules/master-data/customers, company-entities` | 同上 |
| FR14-FR17 基础参考 | `modules/master-data/warehouses, currencies, countries` | 同上 |
| FR18-FR20 搜索分页 | 各模块 QueryDto + QueryBuilder | `components/common/PageTable, SearchForm` |
| FR21-FR25 销售订单 | `modules/sales-orders` | `pages/sales-orders` |
| FR26-FR34 发货需求/物流 | `modules/shipping-demands, logistics-orders` | `pages/shipping-demands` |
| FR35-FR38 采购订单 | `modules/purchase-orders` | `pages/purchase-orders` |
| FR39-FR49 库存管理 | `modules/inventory` | `pages/inventory` |

### 横切关注点到位置映射

| 关注点 | 位置 |
|--------|------|
| 认证 JWT 守卫 | `apps/api/src/common/guards/jwt-auth.guard.ts` |
| 响应格式 | `apps/api/src/common/interceptors/response.interceptor.ts` |
| 错误处理 | `apps/api/src/common/filters/http-exception.filter.ts` |
| 审计字段 | `apps/api/src/common/entities/base.entity.ts` |
| 分页参数 | `apps/api/src/common/dto/pagination.dto.ts` |
| 枚举/类型共享 | `packages/shared/src/enums/` + `packages/shared/src/types/` |
| 前端列表复用 | `apps/web/src/components/common/PageTable.tsx` |
| 前端错误统一弹窗 | `apps/web/src/api/request.ts`（axios 拦截器） |

## 架构验证结果

### 一致性验证 ✅

**技术兼容性：** 全部 5 个核心技术组合（NestJS+TypeORM+MySQL / React+Vite+Ant Design / pnpm workspace / TanStack Query+React / JWT Passport）均为官方支持组合，无版本冲突。

**模式一致性：** snake_case（DB）↔ camelCase（API/前端）通过 NestJS ClassSerializerInterceptor 统一转换；命名规范、错误格式、分页结构在所有模块中保持一致。

**结构对齐：** 项目结构完全支持模块隔离、库存事务边界、类型共享等所有架构决策。

### 需求覆盖验证 ✅

**功能需求（49 条）：** 全部覆盖。FR01-FR49 均有明确的后端模块（`apps/api/src/modules/`）和前端页面（`apps/web/src/pages/`）映射。

**非功能需求（14 条）：**

| 状态 | NFR | 架构支撑 |
|------|-----|---------|
| ✅ | NFR-P3 搜索 < 1s | DB 高频字段索引策略 |
| ✅ | NFR-P5 库存写 < 3s | QueryRunner + SELECT FOR UPDATE |
| ✅ | NFR-R1 可用性 99% | /api/health 端点 + Docker 守护 |
| ✅ | NFR-R2 每日备份 | mysqldump cron + 挂载目录 |
| ✅ | NFR-S1 HTTPS | Nginx TLS 终止 |
| ✅ | NFR-S2 密码不可逆 | bcrypt rounds=12 |
| ✅ | NFR-S3 8h 登出 | Access Token 8h，过期即强制登出 |
| ✅ | NFR-S4 全接口鉴权 | JwtAuthGuard 全局 + @Public() 白名单 |
| ✅ | NFR-U1 Chrome/Edge | Vite 现代构建 |
| ✅ | NFR-U3 库存提示 | STOCK_INSUFFICIENT code + available 数量 |

### 实现就绪性验证 ✅

**决策完整性：** 所有关键决策均已文档化，包含版本号和选型理由，无歧义决策点。

**结构完整性：** 完整目录树涵盖 monorepo 根配置、共享包、后端 21+ 模块、前端所有页面及组件。

**模式完整性：** 命名/结构/格式/通信/错误处理/Loading 六大冲突点均有明确规范和反模式示例。

### 缺口分析

**严重缺口：** 0 — 无阻断实现的缺失决策

**轻微缺口（3 处，不阻断，于首个 Story 处理）：**

1. **ClassSerializer 三件套** — snake_case（DB）↔ camelCase（API）自动转换需三部分同时到位：

   ```typescript
   // ① apps/api/src/main.ts — 全局注册拦截器
   app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

   // ② TypeORM 数据源配置 — 自动将 entity snake_case 列名映射
   // apps/api/src/config/database.config.ts（见下方连接池配置）
   // 实体字段使用 @Column({ name: 'snake_case_field' }) 显式指定列名

   // ③ 所有 Entity 字段加 @Expose()，DTO 类加 @Exclude() 默认排除
   @Entity('sales_orders')
   export class SalesOrder extends BaseEntity {
     @Expose()
     @Column({ name: 'order_no' })
     orderNo: string           // 响应 JSON 中输出 "orderNo"，数据库列为 "order_no"
   }
   ```

   **三件套缺一不可：** `main.ts` 注册 + Entity `@Expose()` + `@Column({ name })` 对齐，否则序列化失效或字段名不一致。

2. 前端初始化命令需补充 `zustand dayjs` 依赖
3. 产品证书有效期预警（FR05）实现方案：查询时计算到期天数，< 30 天标记警告色，MVP 无需后台定时任务

### 架构完整性清单

**✅ 需求分析**
- [x] 项目上下文深度分析（49 FR + 14 NFR + 6 横切关注点）
- [x] 规模与复杂度评估（企业级 High）
- [x] 技术约束识别（无外部集成、无 RBAC、无移动端）
- [x] 横切关注点映射

**✅ 架构决策**
- [x] 关键决策文档化（含版本号）
- [x] 技术栈完整指定
- [x] 集成模式定义（monorepo 类型共享策略）
- [x] 性能与安全考量全面覆盖

**✅ 实现模式**
- [x] 命名约定建立（DB/API/代码三层）
- [x] 结构模式定义（后端 7 文件 / 前端 3 页面）
- [x] 通信模式规范（API 层/queryKey/Store）
- [x] 过程模式文档化（错误处理/Loading/表单提交）

**✅ 项目结构**
- [x] 完整目录树定义
- [x] 组件边界建立
- [x] 集成点映射
- [x] FR 到结构完整映射

### 架构就绪性评估

**总体状态：** 可进入实现阶段

**置信度：** 高

**主要优势：**

- pnpm Monorepo 类型共享消除 DTO 重复，是本架构最大的一致性保障
- 库存事务模式（QueryRunner + FOR UPDATE）明确定义，防止并发超卖
- 9 条执行规范 + 4 条反模式示例，AI Agent 可无歧义遵守
- 所有 NFR 均有明确的架构支撑，不依赖运行时优化

**未来增强点（Post-MVP）：**

- Redis 缓存层（高并发搜索优化）
- CI/CD 流水线（GitHub Actions）
- 国际化支持
- RBAC 权限系统
- CRM 外部集成

### 实现交接

**AI Agent 指引：** 严格遵循本文档所有架构决策、实现模式和执行规范，不得自行发明新的结构或命名约定。

**第一个实现优先级：**

```bash
# 1. monorepo scaffold
mkdir infitek-erp && cd infitek-erp && pnpm init
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# 2. 后端
mkdir -p apps && pnpm dlx @nestjs/cli new apps/api --package-manager pnpm
cd apps/api && pnpm add @nestjs/typeorm typeorm mysql2 @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/swagger @nestjs/config

# 3. 前端
cd ../.. && pnpm create vite apps/web --template react-ts
cd apps/web && pnpm add antd @ant-design/icons @ant-design/pro-components axios @tanstack/react-query react-router-dom zustand dayjs

# 4. 共享包
mkdir -p packages/shared && cd packages/shared && pnpm init
```

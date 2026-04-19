# Story 1.6: 阿里云 OSS 文件上传服务集成

Status: done

## Story

As a 开发者,
I want 后端具备统一的 OSS 文件上传/下载/删除服务模块,
so that 后续 Story 3.5（产品证书库）和 Story 3.6（产品资料库）可以直接调用，无需重复集成 OSS SDK。

## Acceptance Criteria

1. **依赖安装**
   - 执行 `pnpm add ali-oss @types/ali-oss multer @types/multer` 于 `apps/api/`
   - 注意：`@nestjs/platform-express` 已在 package.json 中，无需重复安装
   - 依赖正确写入 `apps/api/package.json`

2. **OssService 初始化**
   - 环境变量 `OSS_REGION`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_BUCKET` 已在 `.env.example` 中定义
   - 应用启动时 OssService 成功初始化 OSS 客户端，无启动报错
   - 使用 `@nestjs/config` 的 `ConfigService` 读取环境变量

3. **文件上传端点**
   - `POST /api/files/upload`，请求体 `multipart/form-data`，字段名 `file`，查询参数 `folder`（如 `certificates`）
   - 返回 `{ success: true, data: { key: "prod/certificates/2026-04/uuid.pdf", filename: "cert.pdf", size: 12345 } }`
   - 文件物理写入阿里云 OSS Bucket

4. **文件类型校验**
   - 允许 MIME 类型白名单：`image/jpeg`、`image/png`、`image/webp`、`application/pdf`
   - 不在白名单的文件类型返回 400，提示"不支持的文件类型"

5. **文件大小校验**
   - 单文件最大 50MB
   - 超过限制返回 400，提示"文件大小不能超过 50MB"

6. **签名 URL 端点**
   - `GET /api/files/signed-url?key=prod/certificates/2026-04/uuid.pdf`
   - 返回有效的签名 URL（有效期 1 小时），浏览器可直接访问文件

7. **文件删除端点**
   - `DELETE /api/files`，请求体 `{ "key": "prod/certificates/2026-04/uuid.pdf" }`
   - OSS 对应对象被物理删除
   - 再次访问该 key 的签名 URL 返回 404

8. **模块结构**
   - `apps/api/src/files/` 包含：
     - `files.module.ts`（全局注册，`isGlobal: true`）
     - `files.service.ts`（upload / getSignedUrl / delete 三个方法）
     - `files.controller.ts`（upload / signed-url / delete 三个端点）
   - `FilesModule` 在 `AppModule` 中注册

## Tasks / Subtasks

### 后端实现

- [ ] 安装依赖（AC: 1）
  - [ ] `cd apps/api && pnpm add ali-oss @types/ali-oss multer @types/multer`

- [ ] 创建 FilesModule 结构（AC: 8）
  - [ ] 新建 `apps/api/src/files/files.module.ts`（`isGlobal: true`）
  - [ ] 新建 `apps/api/src/files/files.service.ts`
  - [ ] 新建 `apps/api/src/files/files.controller.ts`
  - [ ] 在 `apps/api/src/app.module.ts` 的 imports 中注册 `FilesModule`

- [ ] 实现 OssService（AC: 2）
  - [ ] 在 `files.service.ts` 中通过 `ConfigService` 读取 4 个 OSS 环境变量
  - [ ] 在构造函数中初始化 `ali-oss` 客户端（`new OSS({ region, accessKeyId, accessKeySecret, bucket })`）

- [ ] 实现 upload 方法（AC: 3, 4, 5）
  - [ ] 方法签名：`async upload(file: Express.Multer.File, folder: string): Promise<{ key: string; filename: string; size: number }>`
  - [ ] 文件类型校验（MIME 白名单）
  - [ ] 文件大小校验（50MB）
  - [ ] OSS key 格式：`{env}/{folder}/{YYYY-MM}/{uuid}.{ext}`（env 取 `NODE_ENV`，默认 `prod`）
  - [ ] 调用 `ossClient.put(key, buffer)` 上传

- [ ] 实现 getSignedUrl 方法（AC: 6）
  - [ ] 方法签名：`async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string>`
  - [ ] 调用 `ossClient.signatureUrl(key, { expires: expiresInSeconds })`

- [ ] 实现 delete 方法（AC: 7）
  - [ ] 方法签名：`async delete(key: string): Promise<void>`
  - [ ] 调用 `ossClient.delete(key)`

- [ ] 实现 FilesController（AC: 3, 6, 7）
  - [ ] `POST /upload`：使用 `@UseInterceptors(FileInterceptor('file'))` + `@UploadedFile()`
  - [ ] `GET /signed-url`：接收 `@Query('key')` 参数
  - [ ] `DELETE /`：接收 `@Body() { key: string }`

- [ ] 后端测试（AC: 1-8）
  - [ ] `apps/api/src/files/tests/files.service.spec.ts`（mock ali-oss 客户端）
  - [ ] `apps/api/src/files/tests/files.controller.spec.ts`（mock FilesService）

## Dev Notes

### 架构约束（必须遵守）

**模块注册方式：**
- `FilesModule` 必须设置 `isGlobal: true`，这样 Story 3.5/3.6 的模块无需 import 即可注入 `FilesService`
- 在 `AppModule.imports` 中添加 `FilesModule`（参考现有 `UsersModule`、`AuthModule` 的注册方式）

**文件路径规范（来自 architecture.md）：**
- OSS Bucket 结构：`/{env}/{module}/{date}/{uuid}.{ext}`
- 示例：`/prod/certificates/2026-04/uuid.pdf`
- `env` 取 `process.env.NODE_ENV`，开发环境为 `dev`，生产为 `prod`

**API 端点前缀：**
- 全局前缀已在 `main.ts` 设置为 `api`（`app.setGlobalPrefix('api')`）
- Controller 装饰器用 `@Controller('files')`，最终路径为 `/api/files/...`
- 注意：架构文档中端点路径为 `/api/files/upload`（无 `/v1/` 前缀），与其他模块的 `/api/v1/` 不同，因为 FilesModule 是横切服务

**响应格式：**
- 所有响应通过 `ResponseInterceptor` 自动包装为 `{ success, data, message, code }`
- Controller 方法直接返回业务数据即可，无需手动包装

**错误处理：**
- 文件类型/大小校验失败：`throw new BadRequestException({ code: 'INVALID_FILE_TYPE', message: '不支持的文件类型' })`
- 文件类型/大小校验失败：`throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: '文件大小不能超过 50MB' })`
- OSS 操作失败：捕获 ali-oss 异常，包装为 `InternalServerErrorException`

**ClassSerializer 三件套：**
- 已在 `AppModule` 全局注册 `ClassSerializerInterceptor`
- FilesService 返回的是普通对象（非 Entity），无需 `@Expose()` 装饰

### 文件结构

```
apps/api/src/files/
├── files.module.ts       # @Global() + @Module({ controllers, providers, exports })
├── files.service.ts      # OssService：upload / getSignedUrl / delete
├── files.controller.ts   # POST /upload, GET /signed-url, DELETE /
└── tests/
    ├── files.service.spec.ts
    └── files.controller.spec.ts
```

### 关键代码模式

**files.module.ts：**
```typescript
import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Global()
@Module({
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
```

**files.service.ts 核心结构：**
```typescript
import * as OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';  // 注意：需要安装 uuid 或使用 crypto.randomUUID()
import { extname } from 'path';

// 推荐使用 Node.js 内置 crypto.randomUUID()，无需额外依赖
const key = `${env}/${folder}/${dateStr}/${crypto.randomUUID()}${ext}`;
```

**files.controller.ts 上传端点：**
```typescript
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(
  @UploadedFile() file: Express.Multer.File,
  @Query('folder') folder: string = 'general',
) {
  return this.filesService.upload(file, folder);
}
```

**multer 内存存储（不写磁盘）：**
```typescript
// FileInterceptor 默认使用内存存储（memoryStorage），满足 NFR-F1 服务端不在本地磁盘持久化
// 无需额外配置 diskStorage
@UseInterceptors(FileInterceptor('file'))
```

### 环境变量

已在 `.env.example` 中定义（Story 1.6 注释标注）：
```env
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=infitek-erp-files
```

ConfigService 读取方式（参考 `jwt.strategy.ts` 中的模式）：
```typescript
constructor(private readonly configService: ConfigService) {
  this.ossClient = new OSS({
    region: configService.get<string>('OSS_REGION'),
    accessKeyId: configService.get<string>('OSS_ACCESS_KEY_ID'),
    accessKeySecret: configService.get<string>('OSS_ACCESS_KEY_SECRET'),
    bucket: configService.get<string>('OSS_BUCKET'),
  });
}
```

### 测试模式（参考 Story 1-4 的测试结构）

**files.service.spec.ts 关键 mock：**
```typescript
// mock ali-oss
jest.mock('ali-oss', () => {
  return jest.fn().mockImplementation(() => ({
    put: jest.fn().mockResolvedValue({ name: 'key', url: 'https://...' }),
    signatureUrl: jest.fn().mockReturnValue('https://signed-url'),
    delete: jest.fn().mockResolvedValue({}),
  }));
});
```

**测试覆盖要点：**
- 文件类型白名单校验（合法/非法 MIME）
- 文件大小限制（50MB 边界）
- OSS key 格式验证（包含 env/folder/date/uuid）
- getSignedUrl 返回有效 URL
- delete 调用 ossClient.delete

### 前一个 Story 的实现模式（Story 1-4/1-5 学习点）

**已建立的模式（本 Story 必须继承）：**
1. **模块注册**：`AppModule.imports` 数组中添加新模块（参考 `UsersModule`、`AuthModule`）
2. **ConfigService 注入**：构造函数注入 `ConfigService`，通过 `configService.get<string>('KEY')` 读取环境变量
3. **Controller 装饰器**：`@Controller('resource-name')`，无需加 `v1` 前缀（全局前缀已设置）
4. **测试结构**：`tests/` 目录，文件命名 `*.spec.ts`，使用 `@nestjs/testing` 的 `Test.createTestingModule`

**当前 AppModule 已注册的模块（避免重复）：**
- `HealthModule`、`AuthModule`、`UsersModule` 已注册
- `FilesModule` 需要新增到 imports 数组

### 注意事项

1. **ali-oss TypeScript 类型**：`ali-oss` 的 `@types/ali-oss` 类型定义可能不完整，如遇类型错误可使用 `// @ts-ignore` 或 `as any` 处理
2. **multer 类型**：`Express.Multer.File` 类型来自 `@types/multer`，确保已安装
3. **文件 buffer**：multer 内存存储时，`file.buffer` 包含文件内容，直接传给 `ossClient.put(key, file.buffer)`
4. **日期格式**：OSS key 中的日期格式为 `YYYY-MM`，使用 `new Date().toISOString().slice(0, 7)` 获取
5. **本 Story 无前端实现**：FilesModule 是纯后端服务，前端上传组件在 Story 3.5/3.6 中实现

### 参考资源

- [Source: _bmad-output/planning-artifacts/architecture.md#文件存储（阿里云 OSS）] - OSS 架构决策
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6] - 验收标准
- [Source: apps/api/src/app.module.ts] - AppModule 注册模式
- [Source: apps/api/src/modules/auth/strategies/jwt.strategy.ts] - ConfigService 注入模式
- [Source: apps/api/src/modules/users/users.module.ts] - 模块结构参考
- [Source: apps/api/src/common/interceptors/response.interceptor.ts] - 响应格式
- [Source: .env.example] - 环境变量定义

## Review Findings

- [ ] [Review][Patch] 文件端点缺少认证守卫 — upload/getSignedUrl/delete 三个端点均无 `@UseGuards(JwtAuthGuard)`，全局 JwtAuthGuard 通过 APP_GUARD 注册应已覆盖，需确认是否需要 `@Public()` 豁免或已被全局守卫保护 [apps/api/src/files/files.controller.ts]
- [ ] [Review][Patch] file.buffer 未校验即传给 ossClient.put() — 当 multer 内存存储异常时 buffer 可能为 undefined，应在 upload() 中添加 `if (!file.buffer)` 守卫 [apps/api/src/files/files.service.ts:63]
- [ ] [Review][Patch] expiresInSeconds 无范围校验 — getSignedUrl 接受任意数值，负数或超大值会导致签名 URL 立即过期或永久有效，应限制范围（如 60~86400） [apps/api/src/files/files.service.ts:78]
- [ ] [Review][Patch] DeleteFileDto 的 class-validator 装饰器可能不生效 — 需确认全局 ValidationPipe 已启用，否则 @IsString/@IsNotEmpty 不会执行校验 [apps/api/src/files/files.controller.ts:16]
- [x] [Review][Defer] MIME 类型可被客户端伪造（无 magic bytes 校验） [apps/api/src/files/files.service.ts:52] — deferred，magic bytes 校验属于深度防御，超出本 Story 范围，可在安全加固 Story 中处理
- [x] [Review][Defer] NODE_ENV 未设置时默认 prod，开发环境文件可能混入生产路径 [apps/api/src/files/files.service.ts:108] — deferred，本地开发应在 .env 中设置 NODE_ENV=development，属于运维规范问题
- [x] [Review][Defer] 缺少上传/删除速率限制 [apps/api/src/files/files.controller.ts] — deferred，全局 throttler 已在 AppModule 注册，端点级限流可在安全加固 Story 中处理

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Story 1-6 创建于 2026-04-18
- 基于 Story 1-4/1-5 的实现模式
- 架构文档 OSS 章节完整分析

### Completion Notes List

- [ ] 依赖安装完成
- [ ] FilesModule 结构创建完成
- [ ] OssService 初始化实现
- [ ] upload / getSignedUrl / delete 三个方法实现
- [ ] FilesController 三个端点实现
- [ ] AppModule 注册 FilesModule
- [ ] 单元测试和集成测试通过

### File List

**新建文件：**
- apps/api/src/files/files.module.ts
- apps/api/src/files/files.service.ts
- apps/api/src/files/files.controller.ts
- apps/api/src/files/tests/files.service.spec.ts
- apps/api/src/files/tests/files.controller.spec.ts

**修改文件：**
- apps/api/src/app.module.ts（添加 FilesModule 到 imports）
- apps/api/package.json（添加 ali-oss、@types/ali-oss、multer、@types/multer 依赖）

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    app.useLogger(app.get(Logger));
    const bootstrapLogger = app.get(Logger);

    // 运行数据库迁移
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    bootstrapLogger.log('Running database migrations...', 'Bootstrap');
    await dataSource.runMigrations();
    bootstrapLogger.log('Migrations completed', 'Bootstrap');

    // 全局前缀
    app.setGlobalPrefix('api');

    // CORS - 开发环境允许所有 localhost，生产环境严格校验
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const isDev = process.env.NODE_ENV !== 'production';
    app.enableCors({
      origin: isDev ? /^http:\/\/localhost:\d+$/ : corsOrigin,
    });

    // 全局拦截器和过滤器通过 AppModule APP_INTERCEPTOR / APP_FILTER 注册

    // 全局 ValidationPipe
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

    // Swagger - 环境变量控制是否启用
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Infitek ERP API')
        .setDescription('ERP 系统后端接口文档')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    }

    // 验证并解析 PORT
    const portStr = process.env.PORT || '3000';
    const port = parseInt(portStr, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error(`Invalid PORT: ${portStr}. Must be a number between 1 and 65535.`);
    }

    await app.listen(port);
    bootstrapLogger.log(`Server started on port ${port}`, 'Bootstrap');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start server';
    const errorStack = error instanceof Error ? error.stack : String(error);
    // Fallback to stderr here because the application logger may not be ready yet.
    console.error(errorMessage, errorStack);
    process.exit(1);
  }
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // 运行数据库迁移
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    console.log('🔄 Running database migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations completed');

    // 全局前缀
    app.setGlobalPrefix('api/v1');

    // CORS - 验证 CORS_ORIGIN 格式
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    try {
      new URL(corsOrigin);
    } catch {
      throw new Error(`Invalid CORS_ORIGIN: ${corsOrigin}`);
    }
    app.enableCors({
      origin: corsOrigin,
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
    console.log(`✅ Server started on port ${port}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
bootstrap();

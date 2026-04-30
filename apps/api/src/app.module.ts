import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './files/files.module';
import { UnitsModule } from './modules/master-data/units/units.module';
import { WarehousesModule } from './modules/master-data/warehouses/warehouses.module';
import { CurrenciesModule } from './modules/master-data/currencies/currencies.module';
import { CountriesModule } from './modules/master-data/countries/countries.module';
import { CompaniesModule } from './modules/master-data/companies/companies.module';
import { PortsModule } from './modules/master-data/ports/ports.module';
import { LogisticsProvidersModule } from './modules/master-data/logistics-providers/logistics-providers.module';
import { ProductCategoriesModule } from './modules/master-data/product-categories/product-categories.module';
import { SuppliersModule } from './modules/master-data/suppliers/suppliers.module';
import { SpusModule } from './modules/master-data/spus/spus.module';
import { SkusModule } from './modules/master-data/skus/skus.module';
import { SpuFaqsModule } from './modules/master-data/spu-faqs/spu-faqs.module';
import { CertificatesModule } from './modules/master-data/certificates/certificates.module';
import { ProductDocumentsModule } from './modules/master-data/product-documents/product-documents.module';
import { ContractTemplatesModule } from './modules/master-data/contract-templates/contract-templates.module';
import { CustomersModule } from './modules/master-data/customers/customers.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { ShippingDemandsModule } from './modules/shipping-demands/shipping-demands.module';
import { LogisticsOrdersModule } from './modules/logistics-orders/logistics-orders.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { ReceiptOrdersModule } from './modules/receipt-orders/receipt-orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import databaseConfig from './config/database.config';
import { createLoggerConfig } from './config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [databaseConfig],
    }),
    LoggerModule.forRootAsync({
      useFactory: createLoggerConfig,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database')!,
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    UnitsModule,
    WarehousesModule,
    CurrenciesModule,
    CountriesModule,
    CompaniesModule,
    PortsModule,
    LogisticsProvidersModule,
    CustomersModule,
    SalesOrdersModule,
    ShippingDemandsModule,
    LogisticsOrdersModule,
    PurchaseOrdersModule,
    ReceiptOrdersModule,
    InventoryModule,
    ProductCategoriesModule,
    SuppliersModule,
    SpusModule,
    SkusModule,
    SpuFaqsModule,
    CertificatesModule,
    ProductDocumentsModule,
    ContractTemplatesModule,
    OperationLogsModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}

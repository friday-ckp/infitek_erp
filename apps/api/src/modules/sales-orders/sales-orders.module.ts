import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../../files/files.module';
import { CompaniesModule } from '../master-data/companies/companies.module';
import { CountriesModule } from '../master-data/countries/countries.module';
import { CurrenciesModule } from '../master-data/currencies/currencies.module';
import { CustomersModule } from '../master-data/customers/customers.module';
import { PortsModule } from '../master-data/ports/ports.module';
import { SkusModule } from '../master-data/skus/skus.module';
import { UsersModule } from '../users/users.module';
import { SalesOrderExpense } from './entities/sales-order-expense.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersRepository } from './sales-orders.repository';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, SalesOrderItem, SalesOrderExpense]),
    CustomersModule,
    CountriesModule,
    CurrenciesModule,
    CompaniesModule,
    PortsModule,
    UsersModule,
    SkusModule,
    FilesModule,
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersRepository, SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}

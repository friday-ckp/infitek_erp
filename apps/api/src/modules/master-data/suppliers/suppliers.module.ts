import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { SuppliersController } from './suppliers.controller';
import { SuppliersRepository } from './suppliers.repository';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { SupplierPaymentTerm } from './entities/supplier-payment-term.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, SupplierPaymentTerm]),
    CompaniesModule,
  ],
  controllers: [SuppliersController],
  providers: [SuppliersRepository, SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountriesModule } from '../countries/countries.module';
import { UsersModule } from '../../users/users.module';
import { Customer } from './entities/customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), CountriesModule, UsersModule],
  controllers: [CustomersController],
  providers: [CustomersRepository, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { CountriesModule } from '../countries/countries.module';
import { LogisticsProvider } from './entities/logistics-provider.entity';
import { LogisticsProvidersController } from './logistics-providers.controller';
import { LogisticsProvidersRepository } from './logistics-providers.repository';
import { LogisticsProvidersService } from './logistics-providers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogisticsProvider]),
    CountriesModule,
    CompaniesModule,
  ],
  controllers: [LogisticsProvidersController],
  providers: [LogisticsProvidersRepository, LogisticsProvidersService],
  exports: [LogisticsProvidersService],
})
export class LogisticsProvidersModule {}

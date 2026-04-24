import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountriesModule } from '../countries/countries.module';
import { Port } from './entities/port.entity';
import { PortsController } from './ports.controller';
import { PortsRepository } from './ports.repository';
import { PortsService } from './ports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Port]), CountriesModule],
  controllers: [PortsController],
  providers: [PortsRepository, PortsService],
  exports: [PortsService],
})
export class PortsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractTemplatesController } from './contract-templates.controller';
import { ContractTemplatesRepository } from './contract-templates.repository';
import { ContractTemplatesService } from './contract-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContractTemplate])],
  controllers: [ContractTemplatesController],
  providers: [ContractTemplatesRepository, ContractTemplatesService],
  exports: [ContractTemplatesService],
})
export class ContractTemplatesModule {}

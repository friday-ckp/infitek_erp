import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sku } from './entities/sku.entity';
import { SkusRepository } from './skus.repository';
import { SkusService } from './skus.service';
import { SkusController } from './skus.controller';
import { SpusModule } from '../spus/spus.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sku]), SpusModule],
  controllers: [SkusController],
  providers: [SkusRepository, SkusService],
  exports: [SkusService],
})
export class SkusModule {}

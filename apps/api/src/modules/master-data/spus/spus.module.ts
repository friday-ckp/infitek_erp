import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spu } from './entities/spu.entity';
import { SpusController } from './spus.controller';
import { SpusRepository } from './spus.repository';
import { SpusService } from './spus.service';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Spu]), ProductCategoriesModule],
  controllers: [SpusController],
  providers: [SpusRepository, SpusService],
  exports: [SpusService],
})
export class SpusModule {}

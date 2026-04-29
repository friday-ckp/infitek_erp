import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkusModule } from '../master-data/skus/skus.module';
import { WarehousesModule } from '../master-data/warehouses/warehouses.module';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventorySummary } from './entities/inventory-summary.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventorySummary, InventoryBatch, InventoryTransaction]),
    SkusModule,
    WarehousesModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryRepository, InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

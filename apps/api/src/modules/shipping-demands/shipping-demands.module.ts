import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../../files/files.module';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { ShippingDemandInventoryAllocation } from './entities/shipping-demand-inventory-allocation.entity';
import { ShippingDemandItem } from './entities/shipping-demand-item.entity';
import { ShippingDemand } from './entities/shipping-demand.entity';
import { ShippingDemandsController } from './shipping-demands.controller';
import { ShippingDemandsRepository } from './shipping-demands.repository';
import { ShippingDemandsService } from './shipping-demands.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShippingDemand,
      ShippingDemandItem,
      ShippingDemandInventoryAllocation,
      InventoryTransaction,
    ]),
    FilesModule,
    InventoryModule,
  ],
  controllers: [ShippingDemandsController],
  providers: [ShippingDemandsRepository, ShippingDemandsService],
  exports: [ShippingDemandsService],
})
export class ShippingDemandsModule {}

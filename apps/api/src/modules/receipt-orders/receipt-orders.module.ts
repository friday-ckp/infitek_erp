import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { Company } from '../master-data/companies/entities/company.entity';
import { Warehouse } from '../master-data/warehouses/entities/warehouse.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { User } from '../users/entities/user.entity';
import { ReceiptOrderItem } from './entities/receipt-order-item.entity';
import { ReceiptOrder } from './entities/receipt-order.entity';
import { ReceiptOrdersController } from './receipt-orders.controller';
import { ReceiptOrdersRepository } from './receipt-orders.repository';
import { ReceiptOrdersService } from './receipt-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReceiptOrder,
      ReceiptOrderItem,
      PurchaseOrder,
      PurchaseOrderItem,
      ShippingDemandItem,
      Warehouse,
      User,
      Company,
    ]),
    InventoryModule,
  ],
  controllers: [ReceiptOrdersController],
  providers: [ReceiptOrdersRepository, ReceiptOrdersService],
  exports: [ReceiptOrdersService],
})
export class ReceiptOrdersModule {}

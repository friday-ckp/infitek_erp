import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { LogisticsOrdersModule } from '../logistics-orders/logistics-orders.module';
import { LogisticsOrderItem } from '../logistics-orders/entities/logistics-order-item.entity';
import { LogisticsOrder } from '../logistics-orders/entities/logistics-order.entity';
import { Company } from '../master-data/companies/entities/company.entity';
import { Warehouse } from '../master-data/warehouses/entities/warehouse.entity';
import { SalesOrder } from '../sales-orders/entities/sales-order.entity';
import { SalesOrderItem } from '../sales-orders/entities/sales-order-item.entity';
import { ShippingDemandInventoryAllocation } from '../shipping-demands/entities/shipping-demand-inventory-allocation.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { User } from '../users/entities/user.entity';
import { OutboundOrdersController } from './outbound-orders.controller';
import { OutboundOrdersRepository } from './outbound-orders.repository';
import { OutboundOrdersService } from './outbound-orders.service';
import { OutboundAllocationConsumption } from './entities/outbound-allocation-consumption.entity';
import { OutboundOrderItem } from './entities/outbound-order-item.entity';
import { OutboundOrder } from './entities/outbound-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutboundOrder,
      OutboundOrderItem,
      OutboundAllocationConsumption,
      LogisticsOrder,
      LogisticsOrderItem,
      ShippingDemand,
      ShippingDemandItem,
      ShippingDemandInventoryAllocation,
      SalesOrder,
      SalesOrderItem,
      Company,
      User,
      Warehouse,
    ]),
    InventoryModule,
    LogisticsOrdersModule,
  ],
  controllers: [OutboundOrdersController],
  providers: [OutboundOrdersRepository, OutboundOrdersService],
  exports: [OutboundOrdersService],
})
export class OutboundOrdersModule {}

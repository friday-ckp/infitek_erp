import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { LogisticsOrderItem } from './entities/logistics-order-item.entity';
import { LogisticsOrderPackage } from './entities/logistics-order-package.entity';
import { LogisticsOrder } from './entities/logistics-order.entity';
import { LogisticsOrdersController } from './logistics-orders.controller';
import { LogisticsOrdersRepository } from './logistics-orders.repository';
import { LogisticsOrdersService } from './logistics-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LogisticsOrder,
      LogisticsOrderItem,
      LogisticsOrderPackage,
      ShippingDemand,
      ShippingDemandItem,
    ]),
  ],
  controllers: [LogisticsOrdersController],
  providers: [LogisticsOrdersRepository, LogisticsOrdersService],
  exports: [LogisticsOrdersService],
})
export class LogisticsOrdersModule {}

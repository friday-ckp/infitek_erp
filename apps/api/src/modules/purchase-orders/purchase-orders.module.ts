import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractTemplate } from '../master-data/contract-templates/entities/contract-template.entity';
import { Sku } from '../master-data/skus/entities/sku.entity';
import { SupplierPaymentTerm } from '../master-data/suppliers/entities/supplier-payment-term.entity';
import { Supplier } from '../master-data/suppliers/entities/supplier.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      ShippingDemand,
      ShippingDemandItem,
      Supplier,
      SupplierPaymentTerm,
      ContractTemplate,
      Sku,
    ]),
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersRepository, PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}

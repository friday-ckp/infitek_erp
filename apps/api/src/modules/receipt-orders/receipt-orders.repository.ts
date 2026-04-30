import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseOrderStatus } from '@infitek/shared';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { QueryReceiptPurchaseOrderDto } from './dto/query-receipt-purchase-order.dto';
import { ReceiptOrder } from './entities/receipt-order.entity';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

@Injectable()
export class ReceiptOrdersRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ReceiptOrder)
    private readonly receiptOrderRepo: Repository<ReceiptOrder>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  findById(id: number): Promise<ReceiptOrder | null> {
    return this.receiptOrderRepo.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  findBySourceActionKey(sourceActionKey: string): Promise<ReceiptOrder | null> {
    return this.receiptOrderRepo.findOne({
      where: { sourceActionKey },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  findByPurchaseOrderId(purchaseOrderId: number): Promise<ReceiptOrder[]> {
    return this.receiptOrderRepo.find({
      where: { purchaseOrderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findPurchaseOrderOptions(query: QueryReceiptPurchaseOrderDto) {
    const qb = this.dataSource
      .getRepository(PurchaseOrder)
      .createQueryBuilder('purchaseOrder')
      .innerJoin('purchase_order_items', 'item', 'item.purchase_order_id = purchaseOrder.id')
      .select('purchaseOrder.id', 'id')
      .addSelect('purchaseOrder.po_code', 'poCode')
      .addSelect('purchaseOrder.supplier_name', 'supplierName')
      .addSelect('purchaseOrder.status', 'status')
      .addSelect('purchaseOrder.receipt_status', 'receiptStatus')
      .addSelect('purchaseOrder.shipping_demand_id', 'shippingDemandId')
      .addSelect('purchaseOrder.shipping_demand_code', 'shippingDemandCode')
      .addSelect(
        'SUM(GREATEST(item.quantity - item.received_quantity, 0))',
        'remainingTotalQuantity',
      )
      .where('purchaseOrder.status IN (:...statuses)', {
        statuses: [
          PurchaseOrderStatus.PENDING_RECEIPT,
          PurchaseOrderStatus.PARTIALLY_RECEIVED,
        ],
      })
      .groupBy('purchaseOrder.id')
      .having('SUM(GREATEST(item.quantity - item.received_quantity, 0)) > 0')
      .orderBy('purchaseOrder.updated_at', 'DESC')
      .addOrderBy('purchaseOrder.id', 'DESC')
      .take(query.pageSize ?? 20);

    const normalizedKeyword = query.keyword?.trim();
    if (normalizedKeyword) {
      qb.andWhere(
        '(purchaseOrder.po_code LIKE :kw OR purchaseOrder.supplier_name LIKE :kw OR purchaseOrder.shipping_demand_code LIKE :kw OR purchaseOrder.sales_order_code LIKE :kw)',
        { kw: `%${escapeLike(normalizedKeyword)}%` },
      );
    }

    return qb.getRawMany<{
      id: string;
      poCode: string;
      supplierName: string;
      status: string;
      receiptStatus: string;
      shippingDemandId: string | null;
      shippingDemandCode: string | null;
      remainingTotalQuantity: string;
    }>();
  }
}

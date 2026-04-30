import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

@Injectable()
export class PurchaseOrdersRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  findById(id: number): Promise<PurchaseOrder | null> {
    return this.purchaseOrderRepo.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  async findAll(query: QueryPurchaseOrderDto) {
    const {
      keyword,
      supplierId,
      shippingDemandId,
      orderType,
      applicationType,
      demandType,
      receiptStatus,
      status,
      page = 1,
      pageSize = 20,
    } = query;
    const qb = this.purchaseOrderRepo.createQueryBuilder('purchaseOrder');

    const normalizedKeyword = keyword?.trim();
    if (normalizedKeyword) {
      qb.andWhere(
        '(purchaseOrder.po_code LIKE :kw OR purchaseOrder.supplier_code LIKE :kw OR purchaseOrder.supplier_name LIKE :kw OR purchaseOrder.shipping_demand_code LIKE :kw OR purchaseOrder.sales_order_code LIKE :kw)',
        { kw: `%${escapeLike(normalizedKeyword)}%` },
      );
    }

    if (supplierId != null) {
      qb.andWhere('purchaseOrder.supplier_id = :supplierId', { supplierId });
    }
    if (shippingDemandId != null) {
      qb.andWhere('purchaseOrder.shipping_demand_id = :shippingDemandId', {
        shippingDemandId,
      });
    }
    if (orderType) {
      qb.andWhere('purchaseOrder.order_type = :orderType', { orderType });
    }
    if (applicationType) {
      qb.andWhere('purchaseOrder.application_type = :applicationType', {
        applicationType,
      });
    }
    if (demandType) {
      qb.andWhere('purchaseOrder.demand_type = :demandType', { demandType });
    }
    if (receiptStatus) {
      qb.andWhere('purchaseOrder.receipt_status = :receiptStatus', {
        receiptStatus,
      });
    }
    if (status) {
      qb.andWhere('purchaseOrder.status = :status', { status });
    }

    const [list, total] = await qb
      .loadRelationCountAndMap('purchaseOrder.itemCount', 'purchaseOrder.items')
      .orderBy('purchaseOrder.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findBySourceActionKeyPrefix(prefix: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepo
      .createQueryBuilder('purchaseOrder')
      .leftJoinAndSelect('purchaseOrder.items', 'items')
      .where('purchaseOrder.source_action_key LIKE :prefix', {
        prefix: `${escapeLike(prefix)}:%`,
      })
      .orderBy('purchaseOrder.id', 'ASC')
      .addOrderBy('items.id', 'ASC')
      .getMany();
  }
}

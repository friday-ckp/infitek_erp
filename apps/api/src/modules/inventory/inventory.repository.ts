import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { LogisticsOrder } from '../logistics-orders/entities/logistics-order.entity';
import { OutboundOrder } from '../outbound-orders/entities/outbound-order.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { ReceiptOrder } from '../receipt-orders/entities/receipt-order.entity';
import { SalesOrder } from '../sales-orders/entities/sales-order.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { QueryInventoryTransactionDto } from './dto/query-inventory-transaction.dto';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventorySummary } from './entities/inventory-summary.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

export interface InventorySourceDocumentInfo {
  type: string;
  id: number;
  code: string | null;
  label: string;
  path: string | null;
}

interface SourceDocumentConfig {
  entity?: Parameters<DataSource['getRepository']>[0];
  codeField?: string;
  label: string;
  pathBase: string | null;
}

const SOURCE_DOCUMENT_CONFIG: Record<string, SourceDocumentConfig> = {
  opening_inventory: {
    label: '期初库存',
    pathBase: null,
  },
  shipping_demand: {
    entity: ShippingDemand,
    codeField: 'demandCode',
    label: '发货需求',
    pathBase: '/shipping-demands',
  },
  receipt_order: {
    entity: ReceiptOrder,
    codeField: 'receiptCode',
    label: '收货单',
    pathBase: '/receipt-orders',
  },
  outbound_order: {
    entity: OutboundOrder,
    codeField: 'outboundCode',
    label: '出库单',
    pathBase: '/outbound-orders',
  },
  sales_order: {
    entity: SalesOrder,
    codeField: 'erpSalesOrderCode',
    label: '销售订单',
    pathBase: '/sales-orders',
  },
  purchase_order: {
    entity: PurchaseOrder,
    codeField: 'poCode',
    label: '采购订单',
    pathBase: '/purchase-orders',
  },
  logistics_order: {
    entity: LogisticsOrder,
    codeField: 'orderCode',
    label: '物流单',
    pathBase: '/logistics-orders',
  },
};

@Injectable()
export class InventoryRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(InventorySummary)
    private readonly summaryRepo: Repository<InventorySummary>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  async findAvailableSummaries(
    skuIds?: number[],
    warehouseId?: number,
  ): Promise<InventorySummary[]> {
    const where: {
      skuId?: ReturnType<typeof In>;
      warehouseId?: number;
    } = {};
    if (skuIds !== undefined) {
      where.skuId = In(skuIds);
    }
    if (warehouseId !== undefined) {
      where.warehouseId = warehouseId;
    }
    return this.summaryRepo.find({
      where,
      order: {
        skuId: 'ASC',
        warehouseId: 'ASC',
      },
    });
  }

  async findBatches(
    skuIds?: number[],
    warehouseId?: number,
  ): Promise<InventoryBatch[]> {
    const where: {
      skuId?: ReturnType<typeof In>;
      warehouseId?: number;
    } = {};
    if (skuIds !== undefined) {
      where.skuId = In(skuIds);
    }
    if (warehouseId !== undefined) {
      where.warehouseId = warehouseId;
    }
    return this.dataSource.getRepository(InventoryBatch).find({
      where,
      order: {
        skuId: 'ASC',
        warehouseId: 'ASC',
        receiptDate: 'ASC',
        id: 'ASC',
      },
    });
  }

  async findTransactions(query: QueryInventoryTransactionDto): Promise<{
    data: InventoryTransaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.transactionRepo.createQueryBuilder('inventoryTransaction');

    if (query.skuId !== undefined) {
      qb.andWhere('inventoryTransaction.sku_id = :skuId', {
        skuId: query.skuId,
      });
    }
    if (query.warehouseId !== undefined) {
      qb.andWhere('inventoryTransaction.warehouse_id = :warehouseId', {
        warehouseId: query.warehouseId,
      });
    }
    if (query.changeType !== undefined) {
      qb.andWhere('inventoryTransaction.change_type = :changeType', {
        changeType: query.changeType,
      });
    }
    if (query.startTime !== undefined) {
      qb.andWhere('inventoryTransaction.operated_at >= :startTime', {
        startTime: this.toRangeStart(query.startTime),
      });
    }
    if (query.endTime !== undefined) {
      qb.andWhere('inventoryTransaction.operated_at <= :endTime', {
        endTime: this.toRangeEnd(query.endTime),
      });
    }

    const [data, total] = await qb
      .orderBy('inventoryTransaction.operated_at', 'DESC')
      .addOrderBy('inventoryTransaction.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findSourceDocumentInfo(
    transactions: InventoryTransaction[],
  ): Promise<Map<string, InventorySourceDocumentInfo>> {
    const idsByType = new Map<string, Set<number>>();

    transactions.forEach((transaction) => {
      const type = transaction.sourceDocumentType;
      const id = Number(transaction.sourceDocumentId);
      if (!SOURCE_DOCUMENT_CONFIG[type] || !Number.isFinite(id)) {
        return;
      }
      const ids = idsByType.get(type) ?? new Set<number>();
      ids.add(id);
      idsByType.set(type, ids);
    });

    const infoMap = new Map<string, InventorySourceDocumentInfo>();

    await Promise.all(
      [...idsByType.entries()].map(async ([type, ids]) => {
        const config = SOURCE_DOCUMENT_CONFIG[type];
        if (!config?.entity || !config.codeField) return;

        const rows = await this.dataSource
          .getRepository(config.entity)
          .createQueryBuilder('sourceDocument')
          .select('sourceDocument.id', 'id')
          .addSelect(`sourceDocument.${config.codeField}`, 'code')
          .where('sourceDocument.id IN (:...ids)', { ids: [...ids] })
          .getRawMany<{ id: string | number; code: string | null }>();

        rows.forEach((row) => {
          const id = Number(row.id);
          if (!Number.isFinite(id)) return;

          infoMap.set(this.buildSourceDocumentKey(type, id), {
            type,
            id,
            code: row.code,
            label: config.label,
            path: config.pathBase ? `${config.pathBase}/${id}` : null,
          });
        });
      }),
    );

    return infoMap;
  }

  buildSourceDocumentFallback(
    type: string,
    id: number,
  ): InventorySourceDocumentInfo {
    const config = SOURCE_DOCUMENT_CONFIG[type];
    return {
      type,
      id,
      code: null,
      label: config?.label ?? type,
      path: null,
    };
  }

  buildSourceDocumentKey(type: string, id: number): string {
    return `${type}:${id}`;
  }

  findSummaryForUpdate(
    manager: EntityManager,
    skuId: number,
    warehouseId: number,
  ): Promise<InventorySummary | null> {
    return manager
      .getRepository(InventorySummary)
      .createQueryBuilder('summary')
      .setLock('pessimistic_write')
      .where('summary.sku_id = :skuId', { skuId })
      .andWhere('summary.warehouse_id = :warehouseId', { warehouseId })
      .getOne();
  }

  findAvailableBatchesForUpdate(
    manager: EntityManager,
    skuId: number,
    warehouseId: number,
  ): Promise<InventoryBatch[]> {
    return manager
      .getRepository(InventoryBatch)
      .createQueryBuilder('batch')
      .setLock('pessimistic_write')
      .where('batch.sku_id = :skuId', { skuId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.batch_quantity > batch.batch_locked_quantity')
      .orderBy('batch.receipt_date', 'ASC')
      .addOrderBy('batch.id', 'ASC')
      .getMany();
  }

  findBatchesForUpdate(
    manager: EntityManager,
    skuId: number,
    warehouseId: number,
    batchIds: number[],
  ): Promise<InventoryBatch[]> {
    return manager
      .getRepository(InventoryBatch)
      .createQueryBuilder('batch')
      .setLock('pessimistic_write')
      .where('batch.sku_id = :skuId', { skuId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.id IN (:...batchIds)', { batchIds })
      .orderBy('batch.receipt_date', 'ASC')
      .addOrderBy('batch.id', 'ASC')
      .getMany();
  }

  async sumBatchQuantities(
    manager: EntityManager,
    skuId: number,
    warehouseId: number,
  ): Promise<{ actualQuantity: number; lockedQuantity: number }> {
    const result = await manager
      .getRepository(InventoryBatch)
      .createQueryBuilder('batch')
      .select('COALESCE(SUM(batch.batch_quantity), 0)', 'actualQuantity')
      .addSelect(
        'COALESCE(SUM(batch.batch_locked_quantity), 0)',
        'lockedQuantity',
      )
      .where('batch.sku_id = :skuId', { skuId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .getRawOne<{
        actualQuantity: string | number;
        lockedQuantity: string | number;
      }>();

    return {
      actualQuantity: Number(result?.actualQuantity ?? 0),
      lockedQuantity: Number(result?.lockedQuantity ?? 0),
    };
  }

  private toRangeStart(value: string): Date | string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value} 00:00:00.000`;
    }
    return new Date(value);
  }

  private toRangeEnd(value: string): Date | string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value} 23:59:59.999`;
    }
    return new Date(value);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { QueryInventoryTransactionDto } from './dto/query-inventory-transaction.dto';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventorySummary } from './entities/inventory-summary.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

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

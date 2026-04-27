import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InventoryBatchSourceType } from '@infitek/shared';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventorySummary } from './entities/inventory-summary.entity';

@Injectable()
export class InventoryRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(InventorySummary)
    private readonly summaryRepo: Repository<InventorySummary>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  async findAvailableSummaries(
    skuIds: number[],
    warehouseId?: number,
  ): Promise<InventorySummary[]> {
    const where =
      warehouseId === undefined
        ? { skuId: In(skuIds) }
        : { skuId: In(skuIds), warehouseId };
    return this.summaryRepo.find({
      where,
      order: {
        skuId: 'ASC',
        warehouseId: 'ASC',
      },
    });
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

  findInitialBatchForUpdate(
    manager: EntityManager,
    skuId: number,
    warehouseId: number,
  ): Promise<InventoryBatch | null> {
    return manager
      .getRepository(InventoryBatch)
      .createQueryBuilder('batch')
      .setLock('pessimistic_write')
      .where('batch.sku_id = :skuId', { skuId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.source_type = :sourceType', {
        sourceType: InventoryBatchSourceType.INITIAL,
      })
      .orderBy('batch.receipt_date', 'ASC')
      .addOrderBy('batch.id', 'ASC')
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
}

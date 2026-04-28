import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InventoryBatchSourceType } from '@infitek/shared';
import { randomUUID } from 'node:crypto';
import { QueryRunner } from 'typeorm';
import { SkusService } from '../master-data/skus/skus.service';
import { WarehousesService } from '../master-data/warehouses/warehouses.service';
import { CreateOpeningInventoryDto } from './dto/create-opening-inventory.dto';
import { QueryAvailableInventoryDto } from './dto/query-available-inventory.dto';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventorySummary } from './entities/inventory-summary.entity';
import { InventoryRepository } from './inventory.repository';

const MAX_DEADLOCK_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 25;

export interface AvailableInventoryItem {
  skuId: number;
  warehouseId: number | null;
  actualQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  updatedAt?: Date;
}

export interface InventoryBatchItem {
  id: number;
  batchNo: string;
  skuId: number;
  warehouseId: number;
  batchQuantity: number;
  batchLockedQuantity: number;
  batchAvailableQuantity: number;
  sourceType: InventoryBatchSourceType;
  sourceDocumentId: number | null;
  receiptDate: string;
  updatedAt?: Date;
}

export interface InventoryBatchQuantity {
  batchId: number;
  quantity: number;
}

export interface IncreaseStockCommand {
  skuId: number;
  warehouseId: number;
  quantity: number;
  sourceType: InventoryBatchSourceType;
  sourceDocumentId?: number | null;
  receiptDate?: string;
  operator?: string;
}

export interface LockStockCommand {
  skuId: number;
  warehouseId: number;
  quantity: number;
  operator?: string;
}

export interface AllocatedStockCommand {
  skuId: number;
  warehouseId: number;
  allocations: InventoryBatchQuantity[];
  operator?: string;
}

export interface InventoryMutationResult {
  summary: InventorySummary;
  batches: InventoryBatch[];
  allocations?: InventoryBatchQuantity[];
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly skusService: SkusService,
    private readonly warehousesService: WarehousesService,
  ) {}

  async findAvailable(
    query: QueryAvailableInventoryDto,
  ): Promise<AvailableInventoryItem[]> {
    const skuIds = query.skuIds
      ? [...new Set(query.skuIds)].sort((a, b) => a - b)
      : undefined;
    const summaries = await this.inventoryRepository.findAvailableSummaries(
      skuIds,
      query.warehouseId,
    );

    const items = summaries.map((summary) => this.toAvailableItem(summary));

    if (skuIds === undefined) {
      return items.sort(this.sortAvailableItems);
    }

    const existingKeys = new Set(
      items.map((item) => `${item.skuId}:${item.warehouseId}`),
    );

    if (query.warehouseId !== undefined) {
      for (const skuId of skuIds) {
        const key = `${skuId}:${query.warehouseId}`;
        if (!existingKeys.has(key)) {
          items.push(this.createEmptyAvailableItem(skuId, query.warehouseId));
        }
      }
      return items.sort(this.sortAvailableItems);
    }

    const skuIdsWithSummary = new Set(
      items.map((item) => item.skuId),
    );
    for (const skuId of skuIds) {
      if (!skuIdsWithSummary.has(skuId)) {
        items.push(this.createEmptyAvailableItem(skuId, null));
      }
    }

    return items.sort(this.sortAvailableItems);
  }

  async findBatches(
    query: QueryAvailableInventoryDto,
  ): Promise<InventoryBatchItem[]> {
    const skuIds = query.skuIds
      ? [...new Set(query.skuIds)].sort((a, b) => a - b)
      : undefined;
    const batches = await this.inventoryRepository.findBatches(
      skuIds,
      query.warehouseId,
    );
    return batches.map((batch) => this.toBatchItem(batch));
  }

  async recordOpeningBalance(
    dto: CreateOpeningInventoryDto,
    operator?: string,
  ): Promise<{ summary: InventorySummary; batch: InventoryBatch }> {
    await this.assertSkuWarehouseExists(dto.skuId, dto.warehouseId);
    return this.executeWithDeadlockRetry((queryRunner) =>
      this.recordOpeningBalanceInTransaction(queryRunner, dto, operator),
    );
  }

  async increaseStock(
    command: IncreaseStockCommand,
  ): Promise<InventoryMutationResult> {
    this.assertPositiveQuantity(command.quantity);
    if (command.sourceType === InventoryBatchSourceType.INITIAL) {
      throw new BadRequestException({
        code: 'INVALID_INVENTORY_SOURCE_TYPE',
        message: '期初库存请使用期初库存录入能力',
      });
    }
    await this.assertSkuWarehouseExists(command.skuId, command.warehouseId);
    return this.executeWithDeadlockRetry((queryRunner) =>
      this.increaseStockInTransaction(queryRunner, command),
    );
  }

  async lockStock(command: LockStockCommand): Promise<InventoryMutationResult> {
    this.assertPositiveQuantity(command.quantity);
    await this.assertSkuWarehouseExists(command.skuId, command.warehouseId);
    return this.executeWithDeadlockRetry((queryRunner) =>
      this.lockStockInTransaction(queryRunner, command),
    );
  }

  async unlockStock(
    command: AllocatedStockCommand,
  ): Promise<InventoryMutationResult> {
    this.normalizeBatchQuantities(command.allocations);
    await this.assertSkuWarehouseExists(command.skuId, command.warehouseId);
    return this.executeWithDeadlockRetry((queryRunner) =>
      this.unlockStockInTransaction(queryRunner, command),
    );
  }

  async deductLockedStock(
    command: AllocatedStockCommand,
  ): Promise<InventoryMutationResult> {
    this.normalizeBatchQuantities(command.allocations);
    await this.assertSkuWarehouseExists(command.skuId, command.warehouseId);
    return this.executeWithDeadlockRetry((queryRunner) =>
      this.deductLockedStockInTransaction(queryRunner, command),
    );
  }

  private async recordOpeningBalanceInTransaction(
    queryRunner: QueryRunner,
    dto: CreateOpeningInventoryDto,
    operator?: string,
  ): Promise<{ summary: InventorySummary; batch: InventoryBatch }> {
    const manager = queryRunner.manager;
    const batchRepo = manager.getRepository(InventoryBatch);
    const receiptDate =
      dto.receiptDate ?? new Date().toISOString().slice(0, 10);

    const summary = await this.getOrCreateSummaryForUpdate(
      queryRunner,
      dto.skuId,
      dto.warehouseId,
      operator,
    );

    const batch = batchRepo.create({
      batchNo: this.buildPendingBatchNo(),
      skuId: dto.skuId,
      warehouseId: dto.warehouseId,
      batchQuantity: dto.quantity,
      batchLockedQuantity: 0,
      sourceType: InventoryBatchSourceType.INITIAL,
      sourceDocumentId: null,
      receiptDate,
      createdBy: operator,
      updatedBy: operator,
    });
    const savedBatch = await batchRepo.save(batch);
    savedBatch.batchNo = this.buildInitialBatchNo(
      receiptDate,
      Number(savedBatch.id),
    );
    const finalizedBatch = await batchRepo.save(savedBatch);

    const savedSummary = await this.refreshSummaryQuantities(
      queryRunner,
      summary,
      dto.skuId,
      dto.warehouseId,
      operator,
    );

    return { summary: savedSummary, batch: finalizedBatch };
  }

  async increaseStockInTransaction(
    queryRunner: QueryRunner,
    command: IncreaseStockCommand,
  ): Promise<InventoryMutationResult> {
    this.assertPositiveQuantity(command.quantity);
    if (command.sourceType === InventoryBatchSourceType.INITIAL) {
      throw new BadRequestException({
        code: 'INVALID_INVENTORY_SOURCE_TYPE',
        message: '期初库存请使用期初库存录入能力',
      });
    }
    const manager = queryRunner.manager;
    const batchRepo = manager.getRepository(InventoryBatch);
    const receiptDate =
      command.receiptDate ?? new Date().toISOString().slice(0, 10);
    const summary = await this.getOrCreateSummaryForUpdate(
      queryRunner,
      command.skuId,
      command.warehouseId,
      command.operator,
    );

    const batch = batchRepo.create({
      batchNo: this.buildPendingBatchNo(),
      skuId: command.skuId,
      warehouseId: command.warehouseId,
      batchQuantity: command.quantity,
      batchLockedQuantity: 0,
      sourceType: command.sourceType,
      sourceDocumentId: command.sourceDocumentId ?? null,
      receiptDate,
      createdBy: command.operator,
      updatedBy: command.operator,
    });
    const savedBatch = await batchRepo.save(batch);
    savedBatch.batchNo = this.buildReceiptBatchNo(
      command.sourceType,
      receiptDate,
      Number(savedBatch.id),
    );
    const finalizedBatch = await batchRepo.save(savedBatch);
    const savedSummary = await this.refreshSummaryQuantities(
      queryRunner,
      summary,
      command.skuId,
      command.warehouseId,
      command.operator,
    );

    return { summary: savedSummary, batches: [finalizedBatch] };
  }

  async lockStockInTransaction(
    queryRunner: QueryRunner,
    command: LockStockCommand,
  ): Promise<InventoryMutationResult> {
    this.assertPositiveQuantity(command.quantity);
    const manager = queryRunner.manager;
    const batchRepo = manager.getRepository(InventoryBatch);
    const summary = await this.inventoryRepository.findSummaryForUpdate(
      manager,
      command.skuId,
      command.warehouseId,
    );
    const availableQuantity = Number(summary?.availableQuantity ?? 0);
    if (!summary || availableQuantity < command.quantity) {
      throw this.createStockInsufficientException(availableQuantity);
    }

    const batches =
      await this.inventoryRepository.findAvailableBatchesForUpdate(
        manager,
        command.skuId,
        command.warehouseId,
      );
    const touchedBatches: InventoryBatch[] = [];
    const allocations: InventoryBatchQuantity[] = [];
    let remaining = command.quantity;

    for (const batch of batches) {
      if (remaining === 0) break;
      const batchAvailable =
        Number(batch.batchQuantity ?? 0) -
        Number(batch.batchLockedQuantity ?? 0);
      if (batchAvailable <= 0) continue;

      const lockQuantity = Math.min(batchAvailable, remaining);
      batch.batchLockedQuantity =
        Number(batch.batchLockedQuantity ?? 0) + lockQuantity;
      if (command.operator !== undefined) {
        batch.updatedBy = command.operator;
      }
      const savedBatch = await batchRepo.save(batch);
      touchedBatches.push(savedBatch);
      allocations.push({
        batchId: Number(savedBatch.id),
        quantity: lockQuantity,
      });
      remaining -= lockQuantity;
    }

    if (remaining > 0) {
      throw this.createStockInsufficientException(command.quantity - remaining);
    }

    const savedSummary = await this.refreshSummaryQuantities(
      queryRunner,
      summary,
      command.skuId,
      command.warehouseId,
      command.operator,
    );

    return { summary: savedSummary, batches: touchedBatches, allocations };
  }

  async unlockStockInTransaction(
    queryRunner: QueryRunner,
    command: AllocatedStockCommand,
  ): Promise<InventoryMutationResult> {
    return this.applyAllocatedBatchChange(queryRunner, command, 'unlock');
  }

  async deductLockedStockInTransaction(
    queryRunner: QueryRunner,
    command: AllocatedStockCommand,
  ): Promise<InventoryMutationResult> {
    return this.applyAllocatedBatchChange(queryRunner, command, 'deduct');
  }

  private async applyAllocatedBatchChange(
    queryRunner: QueryRunner,
    command: AllocatedStockCommand,
    changeType: 'unlock' | 'deduct',
  ): Promise<InventoryMutationResult> {
    const normalized = this.normalizeBatchQuantities(command.allocations);
    const manager = queryRunner.manager;
    const batchRepo = manager.getRepository(InventoryBatch);
    const summary = await this.inventoryRepository.findSummaryForUpdate(
      manager,
      command.skuId,
      command.warehouseId,
    );

    if (!summary) {
      throw this.createStockInsufficientException(0);
    }

    const batches = await this.inventoryRepository.findBatchesForUpdate(
      manager,
      command.skuId,
      command.warehouseId,
      normalized.batchIds,
    );
    if (batches.length !== normalized.batchIds.length) {
      throw new BadRequestException({
        code: 'INVENTORY_BATCH_NOT_FOUND',
        message: '库存批次不存在或不属于指定 SKU + 仓库',
      });
    }

    const touchedBatches: InventoryBatch[] = [];
    for (const batch of batches) {
      const quantity = normalized.quantityByBatchId.get(Number(batch.id)) ?? 0;
      const lockedQuantity = Number(batch.batchLockedQuantity ?? 0);
      const batchQuantity = Number(batch.batchQuantity ?? 0);
      if (
        lockedQuantity < quantity ||
        (changeType === 'deduct' && batchQuantity < quantity)
      ) {
        throw this.createStockInsufficientException(lockedQuantity);
      }

      batch.batchLockedQuantity = lockedQuantity - quantity;
      if (changeType === 'deduct') {
        batch.batchQuantity = batchQuantity - quantity;
      }
      if (command.operator !== undefined) {
        batch.updatedBy = command.operator;
      }
      touchedBatches.push(await batchRepo.save(batch));
    }

    const savedSummary = await this.refreshSummaryQuantities(
      queryRunner,
      summary,
      command.skuId,
      command.warehouseId,
      command.operator,
    );

    return { summary: savedSummary, batches: touchedBatches };
  }

  private async getOrCreateSummaryForUpdate(
    queryRunner: QueryRunner,
    skuId: number,
    warehouseId: number,
    operator?: string,
  ): Promise<InventorySummary> {
    const manager = queryRunner.manager;
    const existingSummary = await this.inventoryRepository.findSummaryForUpdate(
      manager,
      skuId,
      warehouseId,
    );
    return (
      existingSummary ??
      manager.getRepository(InventorySummary).create({
        skuId,
        warehouseId,
        actualQuantity: 0,
        lockedQuantity: 0,
        availableQuantity: 0,
        createdBy: operator,
        updatedBy: operator,
      })
    );
  }

  private async refreshSummaryQuantities(
    queryRunner: QueryRunner,
    summary: InventorySummary,
    skuId: number,
    warehouseId: number,
    operator?: string,
  ): Promise<InventorySummary> {
    const quantities = await this.inventoryRepository.sumBatchQuantities(
      queryRunner.manager,
      skuId,
      warehouseId,
    );
    summary.actualQuantity = quantities.actualQuantity;
    summary.lockedQuantity = quantities.lockedQuantity;
    summary.availableQuantity =
      quantities.actualQuantity - quantities.lockedQuantity;
    if (operator !== undefined) {
      summary.updatedBy = operator;
    }
    return queryRunner.manager.getRepository(InventorySummary).save(summary);
  }

  private async assertSkuWarehouseExists(
    skuId: number,
    warehouseId: number,
  ): Promise<void> {
    await this.skusService.findById(skuId);
    await this.warehousesService.findById(warehouseId);
  }

  private assertPositiveQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException({
        code: 'INVALID_INVENTORY_QUANTITY',
        message: '库存数量必须为正整数',
      });
    }
  }

  private normalizeBatchQuantities(allocations: InventoryBatchQuantity[]): {
    batchIds: number[];
    quantityByBatchId: Map<number, number>;
  } {
    if (!Array.isArray(allocations) || allocations.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_INVENTORY_ALLOCATION',
        message: '库存批次数量不能为空',
      });
    }

    const quantityByBatchId = new Map<number, number>();
    for (const allocation of allocations) {
      if (!Number.isInteger(allocation.batchId) || allocation.batchId <= 0) {
        throw new BadRequestException({
          code: 'INVALID_INVENTORY_BATCH',
          message: '库存批次 ID 必须为正整数',
        });
      }
      this.assertPositiveQuantity(allocation.quantity);
      quantityByBatchId.set(
        allocation.batchId,
        (quantityByBatchId.get(allocation.batchId) ?? 0) + allocation.quantity,
      );
    }

    return {
      batchIds: [...quantityByBatchId.keys()].sort((a, b) => a - b),
      quantityByBatchId,
    };
  }

  private createStockInsufficientException(
    available: number,
  ): BadRequestException {
    return new BadRequestException({
      code: 'STOCK_INSUFFICIENT',
      message: '库存不足',
      available,
    });
  }

  private async executeWithDeadlockRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.inventoryRepository.createQueryRunner();
      let transactionStarted = false;
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();
        transactionStarted = true;
        const result = await operation(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        if (transactionStarted) {
          await queryRunner.rollbackTransaction();
        }
        if (
          this.isRetryableConcurrencyError(error) &&
          retryCount < MAX_DEADLOCK_RETRIES
        ) {
          retryCount += 1;
          await this.delay(INITIAL_RETRY_DELAY_MS * 2 ** (retryCount - 1));
          continue;
        }
        if (this.isRetryableConcurrencyError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '库存并发更新失败，请稍后重试',
          });
        }
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  private isRetryableConcurrencyError(error: unknown): boolean {
    return this.isDeadlockError(error) || this.isDuplicateEntryError(error);
  }

  private isDeadlockError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return (
      maybeError?.code === 'ER_LOCK_DEADLOCK' || maybeError?.errno === 1213
    );
  }

  private isDuplicateEntryError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return maybeError?.code === 'ER_DUP_ENTRY' || maybeError?.errno === 1062;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toAvailableItem(summary: InventorySummary): AvailableInventoryItem {
    return {
      skuId: Number(summary.skuId),
      warehouseId: Number(summary.warehouseId),
      actualQuantity: Number(summary.actualQuantity),
      lockedQuantity: Number(summary.lockedQuantity),
      availableQuantity: Number(summary.availableQuantity),
      updatedAt: summary.updatedAt,
    };
  }

  private toBatchItem(batch: InventoryBatch): InventoryBatchItem {
    const batchQuantity = Number(batch.batchQuantity);
    const batchLockedQuantity = Number(batch.batchLockedQuantity);
    return {
      id: Number(batch.id),
      batchNo: batch.batchNo,
      skuId: Number(batch.skuId),
      warehouseId: Number(batch.warehouseId),
      batchQuantity,
      batchLockedQuantity,
      batchAvailableQuantity: batchQuantity - batchLockedQuantity,
      sourceType: batch.sourceType,
      sourceDocumentId:
        batch.sourceDocumentId === null ? null : Number(batch.sourceDocumentId),
      receiptDate: batch.receiptDate,
      updatedAt: batch.updatedAt,
    };
  }

  private buildInitialBatchNo(receiptDate: string, batchId: number): string {
    const datePart = receiptDate.replace(/-/g, '');
    return `INV-INIT-${datePart}-${String(batchId).padStart(6, '0')}`;
  }

  private buildReceiptBatchNo(
    sourceType: InventoryBatchSourceType,
    receiptDate: string,
    batchId: number,
  ): string {
    const sourcePrefix =
      sourceType === InventoryBatchSourceType.PURCHASE_RECEIPT
        ? 'REC'
        : sourceType.toUpperCase().replace(/[^A-Z0-9]/g, '-');
    const datePart = receiptDate.replace(/-/g, '');
    return `INV-${sourcePrefix}-${datePart}-${String(batchId).padStart(6, '0')}`;
  }

  private buildPendingBatchNo(): string {
    return `INV-PENDING-${randomUUID()}`;
  }

  private createEmptyAvailableItem(
    skuId: number,
    warehouseId: number | null,
  ): AvailableInventoryItem {
    return {
      skuId,
      warehouseId,
      actualQuantity: 0,
      lockedQuantity: 0,
      availableQuantity: 0,
    };
  }

  private sortAvailableItems(
    a: AvailableInventoryItem,
    b: AvailableInventoryItem,
  ): number {
    if (a.skuId !== b.skuId) return a.skuId - b.skuId;
    return (a.warehouseId ?? 0) - (b.warehouseId ?? 0);
  }
}

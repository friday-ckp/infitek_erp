import { BadRequestException, ConflictException } from '@nestjs/common';
import { InventoryBatchSourceType } from '@infitek/shared';
import { InventoryService } from '../inventory.service';

describe('InventoryService', () => {
  const inventoryRepository = {
    findAvailableSummaries: jest.fn(),
    createQueryRunner: jest.fn(),
    findSummaryForUpdate: jest.fn(),
    findInitialBatchForUpdate: jest.fn(),
    findAvailableBatchesForUpdate: jest.fn(),
    findBatchesForUpdate: jest.fn(),
    sumBatchQuantities: jest.fn(),
  };
  const skusService = { findById: jest.fn() };
  const warehousesService = { findById: jest.fn() };

  const summaryRepo = {
    create: jest.fn((data) => ({ id: undefined, ...data })),
    save: jest.fn(async (data) => ({ id: data.id ?? 1, ...data })),
  };
  const batchRepo = {
    create: jest.fn((data) => ({ id: undefined, ...data })),
    save: jest.fn(async (data) => ({ id: data.id ?? 2, ...data })),
  };

  const makeQueryRunner = () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'InventorySummary') return summaryRepo;
        if (entity.name === 'InventoryBatch') return batchRepo;
        throw new Error(`Unexpected repository: ${entity.name}`);
      }),
    },
  });

  let service: InventoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });
    service = new InventoryService(
      inventoryRepository as any,
      skusService as any,
      warehousesService as any,
    );
    skusService.findById.mockResolvedValue({ id: 11 });
    warehousesService.findById.mockResolvedValue({ id: 22 });
    inventoryRepository.findSummaryForUpdate.mockResolvedValue(null);
    inventoryRepository.findInitialBatchForUpdate.mockResolvedValue(null);
    inventoryRepository.sumBatchQuantities.mockResolvedValue({
      actualQuantity: 10,
      lockedQuantity: 0,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('findAvailable returns summaries and zero row for missing SKU', async () => {
    inventoryRepository.findAvailableSummaries.mockResolvedValue([
      {
        skuId: 1,
        warehouseId: 9,
        actualQuantity: 12,
        lockedQuantity: 2,
        availableQuantity: 10,
        updatedAt: new Date('2026-04-27T00:00:00Z'),
      },
    ]);

    const result = await service.findAvailable({ skuIds: [1, 2] });

    expect(result).toEqual([
      {
        skuId: 1,
        warehouseId: 9,
        actualQuantity: 12,
        lockedQuantity: 2,
        availableQuantity: 10,
        updatedAt: new Date('2026-04-27T00:00:00Z'),
      },
      {
        skuId: 2,
        warehouseId: null,
        actualQuantity: 0,
        lockedQuantity: 0,
        availableQuantity: 0,
      },
    ]);
  });

  it('findAvailable returns warehouse-specific zero rows', async () => {
    inventoryRepository.findAvailableSummaries.mockResolvedValue([]);

    const result = await service.findAvailable({
      skuIds: [3, 2],
      warehouseId: 8,
    });

    expect(inventoryRepository.findAvailableSummaries).toHaveBeenCalledWith(
      [2, 3],
      8,
    );
    expect(result).toEqual([
      {
        skuId: 2,
        warehouseId: 8,
        actualQuantity: 0,
        lockedQuantity: 0,
        availableQuantity: 0,
      },
      {
        skuId: 3,
        warehouseId: 8,
        actualQuantity: 0,
        lockedQuantity: 0,
        availableQuantity: 0,
      },
    ]);
  });

  it('recordOpeningBalance creates initial batch and summary inside a transaction', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);

    const result = await service.recordOpeningBalance(
      { skuId: 11, warehouseId: 22, quantity: 10, receiptDate: '2026-04-01' },
      'admin',
    );

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(batchRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        skuId: 11,
        warehouseId: 22,
        batchQuantity: 10,
        batchLockedQuantity: 0,
        sourceType: InventoryBatchSourceType.INITIAL,
        receiptDate: '2026-04-01',
      }),
    );
    expect(summaryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        skuId: 11,
        warehouseId: 22,
        actualQuantity: 10,
        lockedQuantity: 0,
        availableQuantity: 10,
      }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(result.summary.availableQuantity).toBe(10);
  });

  it('recordOpeningBalance overwrites the initial batch and recomputes summary', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.findSummaryForUpdate.mockResolvedValue({
      id: 4,
      skuId: 11,
      warehouseId: 22,
      actualQuantity: 7,
      lockedQuantity: 1,
      availableQuantity: 6,
    });
    inventoryRepository.findInitialBatchForUpdate.mockResolvedValue({
      id: 5,
      skuId: 11,
      warehouseId: 22,
      batchQuantity: 7,
      batchLockedQuantity: 1,
      sourceType: InventoryBatchSourceType.INITIAL,
      receiptDate: '2026-03-01',
    });
    inventoryRepository.sumBatchQuantities.mockResolvedValue({
      actualQuantity: 12,
      lockedQuantity: 1,
    });

    const result = await service.recordOpeningBalance(
      { skuId: 11, warehouseId: 22, quantity: 12, receiptDate: '2026-04-02' },
      'admin',
    );

    expect(batchRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        batchQuantity: 12,
        receiptDate: '2026-04-02',
      }),
    );
    expect(result.summary.actualQuantity).toBe(12);
    expect(result.summary.availableQuantity).toBe(11);
  });

  it('recordOpeningBalance rejects quantity below locked initial batch quantity', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.findInitialBatchForUpdate.mockResolvedValue({
      id: 5,
      skuId: 11,
      warehouseId: 22,
      batchQuantity: 7,
      batchLockedQuantity: 3,
      sourceType: InventoryBatchSourceType.INITIAL,
      receiptDate: '2026-03-01',
    });

    await expect(
      service.recordOpeningBalance(
        { skuId: 11, warehouseId: 22, quantity: 2, receiptDate: '2026-04-02' },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('increaseStock creates a receipt batch and recalculates summary', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.sumBatchQuantities.mockResolvedValue({
      actualQuantity: 18,
      lockedQuantity: 2,
    });

    const result = await service.increaseStock({
      skuId: 11,
      warehouseId: 22,
      quantity: 8,
      sourceType: InventoryBatchSourceType.PURCHASE_RECEIPT,
      sourceDocumentId: 9001,
      receiptDate: '2026-04-03',
      operator: 'admin',
    });

    expect(batchRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        skuId: 11,
        warehouseId: 22,
        batchQuantity: 8,
        batchLockedQuantity: 0,
        sourceType: InventoryBatchSourceType.PURCHASE_RECEIPT,
        sourceDocumentId: 9001,
        receiptDate: '2026-04-03',
      }),
    );
    expect(result.summary.actualQuantity).toBe(18);
    expect(result.summary.availableQuantity).toBe(16);
  });

  it('lockStock locks FIFO batches and refreshes summary quantities', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.findSummaryForUpdate.mockResolvedValue({
      id: 4,
      skuId: 11,
      warehouseId: 22,
      actualQuantity: 15,
      lockedQuantity: 2,
      availableQuantity: 13,
    });
    inventoryRepository.findAvailableBatchesForUpdate.mockResolvedValue([
      {
        id: 100,
        skuId: 11,
        warehouseId: 22,
        batchQuantity: 5,
        batchLockedQuantity: 2,
        receiptDate: '2026-04-01',
      },
      {
        id: 101,
        skuId: 11,
        warehouseId: 22,
        batchQuantity: 10,
        batchLockedQuantity: 0,
        receiptDate: '2026-04-02',
      },
    ]);
    inventoryRepository.sumBatchQuantities.mockResolvedValue({
      actualQuantity: 15,
      lockedQuantity: 7,
    });

    const result = await service.lockStock({
      skuId: 11,
      warehouseId: 22,
      quantity: 5,
      operator: 'admin',
    });

    expect(
      inventoryRepository.findAvailableBatchesForUpdate,
    ).toHaveBeenCalledWith(queryRunner.manager, 11, 22);
    expect(batchRepo.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 100, batchLockedQuantity: 5 }),
    );
    expect(batchRepo.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 101, batchLockedQuantity: 2 }),
    );
    expect(result.allocations).toEqual([
      { batchId: 100, quantity: 3 },
      { batchId: 101, quantity: 2 },
    ]);
    expect(result.summary.availableQuantity).toBe(8);
  });

  it('lockStock rejects insufficient available quantity', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.findSummaryForUpdate.mockResolvedValue({
      id: 4,
      skuId: 11,
      warehouseId: 22,
      actualQuantity: 3,
      lockedQuantity: 2,
      availableQuantity: 1,
    });

    await expect(
      service.lockStock({
        skuId: 11,
        warehouseId: 22,
        quantity: 2,
        operator: 'admin',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(
      inventoryRepository.findAvailableBatchesForUpdate,
    ).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('unlockStock releases specified locked batch quantities', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.findSummaryForUpdate.mockResolvedValue({
      id: 4,
      skuId: 11,
      warehouseId: 22,
      actualQuantity: 5,
      lockedQuantity: 4,
      availableQuantity: 1,
    });
    inventoryRepository.findBatchesForUpdate.mockResolvedValue([
      {
        id: 100,
        skuId: 11,
        warehouseId: 22,
        batchQuantity: 5,
        batchLockedQuantity: 4,
        receiptDate: '2026-04-01',
      },
    ]);
    inventoryRepository.sumBatchQuantities.mockResolvedValue({
      actualQuantity: 5,
      lockedQuantity: 1,
    });

    const result = await service.unlockStock({
      skuId: 11,
      warehouseId: 22,
      allocations: [{ batchId: 100, quantity: 3 }],
      operator: 'admin',
    });

    expect(batchRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 100,
        batchQuantity: 5,
        batchLockedQuantity: 1,
      }),
    );
    expect(result.summary.availableQuantity).toBe(4);
  });

  it('deductLockedStock deducts actual and locked quantities from specified batches', async () => {
    const queryRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryRepository.findSummaryForUpdate.mockResolvedValue({
      id: 4,
      skuId: 11,
      warehouseId: 22,
      actualQuantity: 5,
      lockedQuantity: 3,
      availableQuantity: 2,
    });
    inventoryRepository.findBatchesForUpdate.mockResolvedValue([
      {
        id: 100,
        skuId: 11,
        warehouseId: 22,
        batchQuantity: 5,
        batchLockedQuantity: 3,
        receiptDate: '2026-04-01',
      },
    ]);
    inventoryRepository.sumBatchQuantities.mockResolvedValue({
      actualQuantity: 3,
      lockedQuantity: 1,
    });

    const result = await service.deductLockedStock({
      skuId: 11,
      warehouseId: 22,
      allocations: [{ batchId: 100, quantity: 2 }],
      operator: 'admin',
    });

    expect(batchRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 100,
        batchQuantity: 3,
        batchLockedQuantity: 1,
      }),
    );
    expect(result.summary.availableQuantity).toBe(2);
  });

  it('recordOpeningBalance retries deadlocks and then succeeds', async () => {
    const firstRunner = makeQueryRunner();
    const secondRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner
      .mockReturnValueOnce(firstRunner)
      .mockReturnValueOnce(secondRunner);
    inventoryRepository.findSummaryForUpdate
      .mockRejectedValueOnce({ code: 'ER_LOCK_DEADLOCK', errno: 1213 })
      .mockResolvedValueOnce(null);

    await service.recordOpeningBalance(
      { skuId: 11, warehouseId: 22, quantity: 10 },
      'admin',
    );

    expect(firstRunner.rollbackTransaction).toHaveBeenCalled();
    expect(firstRunner.release).toHaveBeenCalled();
    expect(secondRunner.commitTransaction).toHaveBeenCalled();
    expect(inventoryRepository.createQueryRunner).toHaveBeenCalledTimes(2);
  });

  it('recordOpeningBalance retries duplicate summary creation and then succeeds', async () => {
    const firstRunner = makeQueryRunner();
    const secondRunner = makeQueryRunner();
    inventoryRepository.createQueryRunner
      .mockReturnValueOnce(firstRunner)
      .mockReturnValueOnce(secondRunner);
    summaryRepo.save
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY', errno: 1062 })
      .mockImplementation(async (data) => ({ id: data.id ?? 1, ...data }));

    await service.recordOpeningBalance(
      { skuId: 11, warehouseId: 22, quantity: 10 },
      'admin',
    );

    expect(firstRunner.rollbackTransaction).toHaveBeenCalled();
    expect(secondRunner.commitTransaction).toHaveBeenCalled();
    expect(inventoryRepository.createQueryRunner).toHaveBeenCalledTimes(2);
  });

  it('recordOpeningBalance throws CONCURRENT_UPDATE after retry limit', async () => {
    inventoryRepository.createQueryRunner
      .mockReturnValueOnce(makeQueryRunner())
      .mockReturnValueOnce(makeQueryRunner())
      .mockReturnValueOnce(makeQueryRunner())
      .mockReturnValueOnce(makeQueryRunner());
    inventoryRepository.findSummaryForUpdate.mockRejectedValue({
      code: 'ER_LOCK_DEADLOCK',
      errno: 1213,
    });

    await expect(
      service.recordOpeningBalance(
        { skuId: 11, warehouseId: 22, quantity: 10 },
        'admin',
      ),
    ).rejects.toThrow(ConflictException);

    expect(inventoryRepository.createQueryRunner).toHaveBeenCalledTimes(4);
  });
});

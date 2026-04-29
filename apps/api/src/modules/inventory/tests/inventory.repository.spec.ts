import { InventoryChangeType } from '@infitek/shared';
import { InventoryRepository } from '../inventory.repository';

describe('InventoryRepository', () => {
  const dataSource = {
    createQueryRunner: jest.fn(),
    getRepository: jest.fn(),
  };
  const summaryRepo = {
    find: jest.fn(),
  };
  const transactionRepo = {
    createQueryBuilder: jest.fn(),
  };

  const qb = {
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  let repository: InventoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of ['andWhere', 'orderBy', 'addOrderBy', 'skip', 'take'] as const) {
      qb[method].mockReturnValue(qb);
    }
    qb.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
    transactionRepo.createQueryBuilder.mockReturnValue(qb);
    repository = new InventoryRepository(
      dataSource as any,
      summaryRepo as any,
      transactionRepo as any,
    );
  });

  it('findTransactions applies filters, date range, sorting and pagination', async () => {
    const result = await repository.findTransactions({
      skuId: 11,
      warehouseId: 22,
      changeType: InventoryChangeType.PURCHASE_RECEIPT,
      startTime: '2026-04-01',
      endTime: '2026-04-29',
      page: 2,
      pageSize: 10,
    });

    expect(transactionRepo.createQueryBuilder).toHaveBeenCalledWith(
      'inventoryTransaction',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventoryTransaction.sku_id = :skuId',
      { skuId: 11 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventoryTransaction.warehouse_id = :warehouseId',
      { warehouseId: 22 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventoryTransaction.change_type = :changeType',
      { changeType: InventoryChangeType.PURCHASE_RECEIPT },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventoryTransaction.operated_at >= :startTime',
      { startTime: '2026-04-01 00:00:00.000' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventoryTransaction.operated_at <= :endTime',
      { endTime: '2026-04-29 23:59:59.999' },
    );
    expect(qb.orderBy).toHaveBeenCalledWith(
      'inventoryTransaction.operated_at',
      'DESC',
    );
    expect(qb.addOrderBy).toHaveBeenCalledWith(
      'inventoryTransaction.id',
      'DESC',
    );
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      data: [{ id: 1 }],
      total: 1,
      page: 2,
      pageSize: 10,
      totalPages: 1,
    });
  });
});

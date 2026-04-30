import {
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderStatus,
  PurchaseOrderType,
} from '@infitek/shared';
import { PurchaseOrdersRepository } from '../purchase-orders.repository';

describe('PurchaseOrdersRepository', () => {
  const makeQueryBuilder = () => {
    const qb = {
      andWhere: jest.fn(() => qb),
      loadRelationCountAndMap: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      skip: jest.fn(() => qb),
      take: jest.fn(() => qb),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    return qb;
  };

  it('applies purchase order list filters and pagination', async () => {
    const qb = makeQueryBuilder();
    const purchaseOrderRepo = {
      createQueryBuilder: jest.fn(() => qb),
    };
    const repository = new PurchaseOrdersRepository(
      { createQueryRunner: jest.fn() } as any,
      purchaseOrderRepo as any,
      {} as any,
    );

    const result = await repository.findAll({
      keyword: 'SUP_88',
      supplierId: 88,
      shippingDemandId: 500,
      orderType: PurchaseOrderType.REQUISITION,
      applicationType: PurchaseOrderApplicationType.SALES_REQUISITION,
      demandType: PurchaseOrderDemandType.SALES_ORDER,
      receiptStatus: PurchaseOrderReceiptStatus.NOT_RECEIVED,
      status: PurchaseOrderStatus.PENDING_CONFIRM,
      page: 2,
      pageSize: 50,
    });

    expect(result).toEqual({
      list: [],
      total: 0,
      page: 2,
      pageSize: 50,
      totalPages: 0,
    });
    expect(purchaseOrderRepo.createQueryBuilder).toHaveBeenCalledWith(
      'purchaseOrder',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('purchaseOrder.supplier_code LIKE :kw'),
      { kw: '%SUP\\_88%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.supplier_id = :supplierId',
      { supplierId: 88 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.shipping_demand_id = :shippingDemandId',
      { shippingDemandId: 500 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.order_type = :orderType',
      { orderType: PurchaseOrderType.REQUISITION },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.application_type = :applicationType',
      { applicationType: PurchaseOrderApplicationType.SALES_REQUISITION },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.demand_type = :demandType',
      { demandType: PurchaseOrderDemandType.SALES_ORDER },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.receipt_status = :receiptStatus',
      { receiptStatus: PurchaseOrderReceiptStatus.NOT_RECEIVED },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('purchaseOrder.status = :status', {
      status: PurchaseOrderStatus.PENDING_CONFIRM,
    });
    expect(qb.skip).toHaveBeenCalledWith(50);
    expect(qb.take).toHaveBeenCalledWith(50);
  });
});

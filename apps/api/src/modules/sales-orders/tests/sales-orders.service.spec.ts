import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReceiptStatus, SalesOrderSource, SalesOrderStatus, SalesOrderType, YesNo } from '@infitek/shared';
import { SalesOrdersService } from '../sales-orders.service';

describe('SalesOrdersService', () => {
  const salesOrdersRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByExternalOrderCode: jest.fn(),
    generateErpOrderCode: jest.fn(),
    createWithRelations: jest.fn(),
    update: jest.fn(),
  };
  const customersService = { findById: jest.fn() };
  const countriesService = { findById: jest.fn() };
  const currenciesService = { findById: jest.fn() };
  const companiesService = { findById: jest.fn() };
  const portsService = { findById: jest.fn() };
  const usersService = { findById: jest.fn() };
  const skusService = { findById: jest.fn() };
  const filesService = { getSignedUrl: jest.fn() };

  let service: SalesOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SalesOrdersService(
      salesOrdersRepository as any,
      customersService as any,
      countriesService as any,
      currenciesService as any,
      companiesService as any,
      portsService as any,
      usersService as any,
      skusService as any,
      filesService as any,
    );
  });

  it('create should create a pending submit order', async () => {
    salesOrdersRepository.findByExternalOrderCode.mockResolvedValue(null);
    salesOrdersRepository.generateErpOrderCode.mockResolvedValue('SO2026042600001');
    customersService.findById.mockResolvedValue({
      id: 1,
      customerName: '测试客户',
      customerCode: 'KH001',
      contactPerson: '张三',
    });
    currenciesService.findById.mockResolvedValue({
      id: 2,
      code: 'USD',
      name: '美元',
      symbol: '$',
    });
    skusService.findById.mockResolvedValue({
      id: 11,
      skuCode: 'SKU001',
      nameCn: '离心机',
      nameEn: 'Centrifuge',
      specification: '220V',
      spuId: 99,
      electricalParams: '220V',
      hasPlug: true,
      unitId: 6,
      material: '金属',
      productImageUrl: 'https://example.com/a.png',
      grossWeightKg: 2.5,
      volumeCbm: 0.6,
      packagingList: JSON.stringify([{ grossWeightKg: 2.5, volumeCbm: 0.6 }]),
    });
    usersService.findById.mockResolvedValue({ id: '8', name: '采购员A' });
    salesOrdersRepository.createWithRelations.mockImplementation(
      async (order, items, expenses) => ({
        id: 100,
        ...order,
        items,
        expenses,
      }),
    );

    const result = await service.create(
      {
        domesticTradeType: 'foreign',
        externalOrderCode: 'EXT-001',
        orderType: SalesOrderType.SALES,
        customerId: 1,
        currencyId: 2,
        contractAmount: 1000,
        receivedAmount: 200,
        receiptStatus: ReceiptStatus.PARTIALLY_PAID,
        items: [
          {
            skuId: 11,
            quantity: 2,
            unitPrice: 300,
            purchaserId: 8,
            needsPurchase: YesNo.YES,
          },
        ],
        expenses: [{ expenseName: '运费', amount: 50 }],
      } as any,
      'admin',
    );

    expect(salesOrdersRepository.createWithRelations).toHaveBeenCalled();
    expect(result.erpSalesOrderCode).toBe('SO2026042600001');
    expect(result.orderSource).toBe(SalesOrderSource.MANUAL);
    expect(result.status).toBe(SalesOrderStatus.PENDING_SUBMIT);
    expect(result.outstandingAmount).toBe('800.00');
    expect(result.productTotalAmount).toBe('600.00');
    expect(result.expenseTotalAmount).toBe('50.00');
    expect(result.totalAmount).toBe('650.00');
  });

  it('create should reject duplicate external order code', async () => {
    salesOrdersRepository.findByExternalOrderCode.mockResolvedValue({ id: 1 });

    await expect(
      service.create(
        {
          domesticTradeType: 'foreign',
          externalOrderCode: 'EXT-001',
          orderType: SalesOrderType.SALES,
          customerId: 1,
          contractAmount: 100,
          receivedAmount: 0,
          items: [{ skuId: 11, quantity: 1, unitPrice: 100 }],
        } as any,
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('findById should throw when order missing', async () => {
    salesOrdersRepository.findById.mockResolvedValue(null);

    await expect(service.findById(404)).rejects.toThrow(NotFoundException);
  });

  it('submit should only allow pending submit or rejected', async () => {
    salesOrdersRepository.findById.mockResolvedValue({
      id: 1,
      status: SalesOrderStatus.APPROVED,
    });

    await expect(service.submit(1, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('approve should move in_review to approved', async () => {
    salesOrdersRepository.findById.mockResolvedValue({
      id: 1,
      status: SalesOrderStatus.IN_REVIEW,
    });
    salesOrdersRepository.update.mockResolvedValue({
      id: 1,
      status: SalesOrderStatus.APPROVED,
      contractFileKeys: null,
      plugPhotoKeys: null,
    });

    const result = await service.approve(1, 'reviewer');
    expect(result.status).toBe(SalesOrderStatus.APPROVED);
  });
});

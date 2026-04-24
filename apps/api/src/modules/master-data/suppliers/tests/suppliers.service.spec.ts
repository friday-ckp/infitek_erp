import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from '../../companies/companies.service';
import { SuppliersRepository } from '../suppliers.repository';
import { SuppliersService } from '../suppliers.service';

describe('SuppliersService', () => {
  let service: SuppliersService;

  const suppliersRepositoryMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    generateCode: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    replacePaymentTerms: jest.fn(),
  };

  const companiesServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: SuppliersRepository, useValue: suppliersRepositoryMock },
        { provide: CompaniesService, useValue: companiesServiceMock },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();
  });

  it('应创建供应商并自动生成编码', async () => {
    suppliersRepositoryMock.findByName.mockResolvedValue(null);
    suppliersRepositoryMock.generateCode.mockResolvedValue('YCCG0001');
    companiesServiceMock.findById.mockResolvedValue({ id: 1, nameCn: '星辰科技' });
    suppliersRepositoryMock.create.mockReturnValue({ id: 1 });
    suppliersRepositoryMock.save.mockResolvedValue({ id: 1 });
    suppliersRepositoryMock.replacePaymentTerms.mockResolvedValue([]);
    suppliersRepositoryMock.findById.mockResolvedValue({
      id: 1,
      name: '信达包装',
      supplierCode: 'YCCG0001',
      paymentTerms: [],
    });

    const result = await service.create(
      {
        name: '信达包装',
        paymentTerms: [{ companyId: 1, settlementDays: 30 }],
      },
      'admin',
    );

    expect(result.supplierCode).toBe('YCCG0001');
    expect(suppliersRepositoryMock.generateCode).toHaveBeenCalled();
    expect(suppliersRepositoryMock.replacePaymentTerms).toHaveBeenCalled();
  });

  it('供应商名称重复时抛错', async () => {
    suppliersRepositoryMock.findByName.mockResolvedValue({ id: 9, name: '信达包装' });

    await expect(service.create({ name: '信达包装' }, 'admin')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('查询不存在供应商详情时抛错', async () => {
    suppliersRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.findById(404)).rejects.toThrow(NotFoundException);
  });

  it('更新时名称重复应抛错', async () => {
    suppliersRepositoryMock.findById.mockResolvedValue({
      id: 1,
      name: '信达包装',
      paymentTerms: [],
    });
    suppliersRepositoryMock.findByName.mockResolvedValue({ id: 2, name: '远航供应商' });

    await expect(service.update(1, { name: '远航供应商' }, 'admin')).rejects.toThrow(
      BadRequestException,
    );
  });
});

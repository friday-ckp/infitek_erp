import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from '../../companies/companies.service';
import { CountriesService } from '../../countries/countries.service';
import { LogisticsProvidersRepository } from '../logistics-providers.repository';
import { LogisticsProvidersService } from '../logistics-providers.service';

describe('LogisticsProvidersService', () => {
  let service: LogisticsProvidersService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findByCode: jest.fn(),
    findLatestCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const countriesServiceMock = {
    findById: jest.fn(),
  };

  const companiesServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsProvidersService,
        { provide: LogisticsProvidersRepository, useValue: repoMock },
        { provide: CountriesService, useValue: countriesServiceMock },
        { provide: CompaniesService, useValue: companiesServiceMock },
      ],
    }).compile();

    service = module.get<LogisticsProvidersService>(LogisticsProvidersService);
    jest.clearAllMocks();
  });

  it('应创建物流供应商', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.findByCode.mockResolvedValue(null);
    repoMock.findLatestCode.mockResolvedValue('YCWL0007');
    countriesServiceMock.findById.mockResolvedValue({ id: 1, name: '中国' });
    companiesServiceMock.findById.mockResolvedValue({ id: 2, nameCn: '星辰科技有限公司' });
    repoMock.create.mockResolvedValue({ id: 1, name: '顺丰国际', providerCode: 'YCWL0008' });

    await service.create(
      {
        name: '顺丰国际',
        shortName: '顺丰',
        contactPerson: '张三',
        contactPhone: '13800138000',
        contactEmail: 'test@example.com',
        address: '上海市浦东新区',
        countryId: 1,
        defaultCompanyId: 2,
      },
      'admin',
    );

    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '顺丰国际',
        providerCode: 'YCWL0008',
        shortName: '顺丰',
        contactPerson: '张三',
        countryName: '中国',
        defaultCompanyName: '星辰科技有限公司',
      }),
    );
  });

  it('创建重复名称应抛错', async () => {
    repoMock.findByName.mockResolvedValue({ id: 1, name: '顺丰国际' });

    await expect(service.create({ name: '顺丰国际' }, 'admin')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('应更新物流供应商', async () => {
    repoMock.findById.mockResolvedValue({
      id: 1,
      name: '顺丰国际',
      providerCode: 'SF',
      shortName: '顺丰',
      contactPerson: '张三',
      contactPhone: '13800138000',
      contactEmail: 'test@example.com',
      address: '上海市浦东新区',
      status: '合作',
      providerLevel: null,
      countryId: 1,
      countryName: '中国',
      defaultCompanyId: null,
      defaultCompanyName: null,
    });
    repoMock.findByName.mockResolvedValue(null);
    repoMock.findByCode.mockResolvedValue(null);
    repoMock.update.mockResolvedValue({ id: 1, name: '顺丰国际物流' });

    const result = await service.update(
      1,
      { name: '顺丰国际物流', providerLevel: 5 },
      'admin',
    );

    expect(result.name).toBe('顺丰国际物流');
  });

  it('更新不存在物流供应商应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { name: 'x' }, 'admin')).rejects.toThrow(
      NotFoundException,
    );
  });
});

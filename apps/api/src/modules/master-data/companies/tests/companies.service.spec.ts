import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesRepository } from '../companies.repository';
import { CompaniesService } from '../companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: CompaniesRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    jest.clearAllMocks();
  });

  it('应分页查询公司主体列表', async () => {
    const payload = {
      list: [
        {
          id: 1,
          nameCn: '星辰科技有限公司',
          signingLocation: '上海市',
          bankName: null,
          bankAccount: null,
          swiftCode: null,
          defaultCurrencyCode: null,
          taxId: null,
          customsCode: null,
          quarantineCode: null,
          nameEn: null,
          abbreviation: null,
          countryId: null,
          countryName: null,
          addressCn: null,
          addressEn: null,
          contactPerson: null,
          contactPhone: null,
          defaultCurrencyName: null,
          chiefAccountantId: null,
          chiefAccountantName: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    repoMock.findAll.mockResolvedValue(payload);

    const result = await service.findAll({ page: 1, pageSize: 20 });

    expect(result).toEqual(payload);
    expect(repoMock.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it('应创建公司主体', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.create.mockResolvedValue({
      id: 1,
      nameCn: '星辰科技有限公司',
      signingLocation: '上海市',
      bankName: null,
      bankAccount: null,
      swiftCode: null,
      defaultCurrencyCode: 'USD',
      defaultCurrencyName: '美元',
      taxId: '91310000XXXXXXXXXX',
      customsCode: null,
      quarantineCode: null,
      nameEn: 'Startech Co., Ltd.',
      abbreviation: '星辰',
      countryId: 1,
      countryName: '中国',
      addressCn: '上海市浦东新区',
      addressEn: 'Pudong, Shanghai',
      contactPerson: '张三',
      contactPhone: '13800138000',
      chiefAccountantId: 10,
      chiefAccountantName: '李四',
      createdBy: 'admin',
      updatedBy: 'admin',
    });

    const result = await service.create(
      {
        nameCn: '星辰科技有限公司',
        signingLocation: '上海市',
        defaultCurrencyCode: 'USD',
        defaultCurrencyName: '美元',
        taxId: '91310000XXXXXXXXXX',
        nameEn: 'Startech Co., Ltd.',
        abbreviation: '星辰',
        countryId: 1,
        countryName: '中国',
        addressCn: '上海市浦东新区',
        addressEn: 'Pudong, Shanghai',
        contactPerson: '张三',
        contactPhone: '13800138000',
        chiefAccountantId: 10,
        chiefAccountantName: '李四',
      },
      'admin',
    );

    expect(result.nameCn).toBe('星辰科技有限公司');
    expect(result.addressCn).toBe('上海市浦东新区');
    expect(result.chiefAccountantName).toBe('李四');
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nameCn: '星辰科技有限公司',
        addressCn: '上海市浦东新区',
        chiefAccountantId: 10,
        chiefAccountantName: '李四',
        createdBy: 'admin',
        updatedBy: 'admin',
      }),
    );
  });

  it('创建时公司名称重复应抛错', async () => {
    repoMock.findByName.mockResolvedValue({ id: 99, nameCn: '星辰科技有限公司' });

    await expect(
      service.create({ nameCn: '星辰科技有限公司' }, 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('应更新公司主体', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, nameCn: '星辰科技有限公司' });
    repoMock.findByName.mockResolvedValue(null);
    repoMock.update.mockResolvedValue({
      id: 1,
      nameCn: '星辰科技股份有限公司',
      signingLocation: '北京市',
      addressCn: '北京市朝阳区',
      chiefAccountantName: '王五',
      updatedBy: 'admin',
    });

    const result = await service.update(
      1,
      { nameCn: '星辰科技股份有限公司', signingLocation: '北京市', addressCn: '北京市朝阳区', chiefAccountantName: '王五' },
      'admin',
    );

    expect(result.nameCn).toBe('星辰科技股份有限公司');
    expect(result.addressCn).toBe('北京市朝阳区');
    expect(repoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nameCn: '星辰科技股份有限公司', updatedBy: 'admin' }),
    );
  });

  it('更新名称重复应抛错', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, nameCn: '星辰科技有限公司' });
    repoMock.findByName.mockResolvedValue({ id: 2, nameCn: '另一公司' });

    await expect(
      service.update(1, { nameCn: '另一公司' }, 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('更新不存在的公司主体应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { nameCn: 'x' }, 'admin')).rejects.toThrow(NotFoundException);
  });

  it('查询详情不存在应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById(404)).rejects.toThrow(NotFoundException);
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CountriesService } from '../../countries/countries.service';
import { PortsRepository } from '../ports.repository';
import { PortsService } from '../ports.service';

describe('PortsService', () => {
  let service: PortsService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const countriesServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortsService,
        { provide: PortsRepository, useValue: repoMock },
        { provide: CountriesService, useValue: countriesServiceMock },
      ],
    }).compile();

    service = module.get<PortsService>(PortsService);
    jest.clearAllMocks();
  });

  it('应返回分页港口列表', async () => {
    const payload = { list: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    repoMock.findAll.mockResolvedValue(payload);

    const result = await service.findAll({ page: 1, pageSize: 20 });

    expect(result).toEqual(payload);
    expect(repoMock.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it('应创建港口', async () => {
    repoMock.findByCode.mockResolvedValue(null);
    countriesServiceMock.findById.mockResolvedValue({ id: 1, name: '中国' });
    repoMock.create.mockResolvedValue({ id: 1, portCode: 'CNSHK', nameCn: '蛇口港' });

    await service.create(
      { portCode: 'CNSHK', nameCn: '蛇口港', countryId: 1 },
      'admin',
    );

    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        portCode: 'CNSHK',
        nameCn: '蛇口港',
        countryId: 1,
        countryName: '中国',
        createdBy: 'admin',
      }),
    );
  });

  it('创建重复港口代码应抛错', async () => {
    repoMock.findByCode.mockResolvedValue({ id: 2, portCode: 'CNSHK' });

    await expect(
      service.create({ portCode: 'CNSHK', nameCn: '蛇口港', countryId: 1 }, 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('应更新港口', async () => {
    repoMock.findById.mockResolvedValue({
      id: 1,
      portCode: 'CNSHK',
      nameCn: '蛇口港',
      countryId: 1,
      countryName: '中国',
      portType: '起运港',
      nameEn: 'Shekou Port',
    });
    repoMock.findByCode.mockResolvedValue(null);
    countriesServiceMock.findById.mockResolvedValue({ id: 2, name: '美国' });
    repoMock.update.mockResolvedValue({ id: 1, portCode: 'USLAX', nameCn: '洛杉矶港' });

    const result = await service.update(
      1,
      { portCode: 'USLAX', nameCn: '洛杉矶港', countryId: 2, portType: '目的港', nameEn: 'Los Angeles Port' },
      'admin',
    );

    expect(result.nameCn).toBe('洛杉矶港');
    expect(repoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ portCode: 'USLAX', countryId: 2, updatedBy: 'admin' }),
    );
  });

  it('更新不存在港口应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(999, { nameCn: 'x' }, 'admin')).rejects.toThrow(
      NotFoundException,
    );
  });
});

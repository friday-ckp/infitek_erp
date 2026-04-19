import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UnitStatus } from '@infitek/shared';
import { UnitsRepository } from '../units.repository';
import { UnitsService } from '../units.service';

describe('UnitsService', () => {
  let service: UnitsService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        {
          provide: UnitsRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    jest.clearAllMocks();
  });

  it('应分页查询单位列表', async () => {
    const payload = {
      list: [
        {
          id: 1,
          code: 'PCS',
          name: '件',
          status: UnitStatus.ACTIVE,
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

  it('应创建单位', async () => {
    repoMock.findByCode.mockResolvedValue(null);
    repoMock.create.mockResolvedValue({
      id: 1,
      code: 'PCS',
      name: '件',
      status: UnitStatus.ACTIVE,
      createdBy: 'admin',
      updatedBy: 'admin',
    });

    const result = await service.create({ code: 'PCS', name: '件' }, 'admin');

    expect(result.code).toBe('PCS');
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: UnitStatus.ACTIVE,
        createdBy: 'admin',
        updatedBy: 'admin',
      }),
    );
  });

  it('创建时编码重复应抛错', async () => {
    repoMock.findByCode.mockResolvedValue({ id: 99, code: 'PCS' });

    await expect(service.create({ code: 'PCS', name: '件' }, 'admin')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('应更新单位', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, code: 'PCS', name: '件' });
    repoMock.findByCode.mockResolvedValue(null);
    repoMock.update.mockResolvedValue({
      id: 1,
      code: 'SET',
      name: '套',
      status: UnitStatus.ACTIVE,
      updatedBy: 'admin',
    });

    const result = await service.update(1, { code: 'SET', name: '套' }, 'admin');

    expect(result.code).toBe('SET');
    expect(repoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ code: 'SET', name: '套', updatedBy: 'admin' }),
    );
  });

  it('更新不存在单位应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { name: 'x' }, 'admin')).rejects.toThrow(NotFoundException);
  });

  it('查询详情不存在应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById(404)).rejects.toThrow(NotFoundException);
  });
});

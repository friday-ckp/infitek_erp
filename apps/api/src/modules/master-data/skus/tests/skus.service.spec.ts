import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SkusRepository } from '../skus.repository';
import { SkusService } from '../skus.service';
import { SpusService } from '../../spus/spus.service';

describe('SkusService', () => {
  let service: SkusService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    generateCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const spusServiceMock = {
    findById: jest.fn(),
  };

  const validCreateDto = {
    spuId: 1,
    specification: '测试规格',
    weightKg: 1.5,
    volumeCbm: 0.01,
    hsCode: '94054290',
    customsNameCn: '灯具',
    customsNameEn: 'Lighting',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkusService,
        { provide: SkusRepository, useValue: repoMock },
        { provide: SpusService, useValue: spusServiceMock },
      ],
    }).compile();

    service = module.get<SkusService>(SkusService);
    jest.clearAllMocks();
  });

  it('创建 SKU 成功，自动生成 sku_code SKU001', async () => {
    spusServiceMock.findById.mockResolvedValue({ id: 1, name: '测试SPU' });
    repoMock.generateCode.mockResolvedValue('SKU001');
    repoMock.create.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 1, specification: '测试规格' });

    const result = await service.create(validCreateDto, 'admin');

    expect(result.skuCode).toBe('SKU001');
    expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({ skuCode: 'SKU001', spuId: 1 }));
  });

  it('创建 SKU 时 spu_id 不存在 → NotFoundException', async () => {
    spusServiceMock.findById.mockResolvedValue(null);

    await expect(service.create(validCreateDto, 'admin')).rejects.toThrow(NotFoundException);
    expect(repoMock.create).not.toHaveBeenCalled();
  });

  it('创建 SKU 时 spu_id 存在 → 成功创建，spuId 正确记录', async () => {
    spusServiceMock.findById.mockResolvedValue({ id: 1, name: '测试SPU' });
    repoMock.generateCode.mockResolvedValue('SKU001');
    repoMock.create.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 1 });

    await service.create(validCreateDto, 'admin');

    expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({ spuId: 1 }));
  });

  it('更新 SKU 名称成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 1, specification: '旧规格' });
    repoMock.update.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 1, specification: '新规格' });

    const result = await service.update(1, { specification: '新规格' }, 'admin');

    expect(result.specification).toBe('新规格');
    expect(repoMock.update).toHaveBeenCalledWith(1, expect.objectContaining({ specification: '新规格', updatedBy: 'admin' }));
  });

  it('更新 SKU 时 spuId 变更且 SPU 存在 → 成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 1 });
    spusServiceMock.findById.mockResolvedValue({ id: 2, name: '另一个SPU' });
    repoMock.update.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 2 });

    await service.update(1, { spuId: 2 }, 'admin');

    expect(spusServiceMock.findById).toHaveBeenCalledWith(2);
    expect(repoMock.update).toHaveBeenCalledWith(1, expect.objectContaining({ spuId: 2 }));
  });

  it('更新 SKU 时 spuId 变更但 SPU 不存在 → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, skuCode: 'SKU001', spuId: 1 });
    spusServiceMock.findById.mockResolvedValue(null);

    await expect(service.update(1, { spuId: 999 }, 'admin')).rejects.toThrow(NotFoundException);
    expect(repoMock.update).not.toHaveBeenCalled();
  });

  it('更新不存在的 SKU → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { specification: '新规格' }, 'admin')).rejects.toThrow(NotFoundException);
  });

  it('删除 SKU 成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, skuCode: 'SKU001' });
    repoMock.delete.mockResolvedValue(undefined);

    await expect(service.delete(1)).resolves.toBeUndefined();
    expect(repoMock.delete).toHaveBeenCalledWith(1);
  });

  it('删除不存在的 SKU → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.delete(404)).rejects.toThrow(NotFoundException);
  });

  it('查询 SKU 列表支持 spuId 过滤', async () => {
    repoMock.findAll.mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });

    await service.findAll({ spuId: 1 });

    expect(repoMock.findAll).toHaveBeenCalledWith(expect.objectContaining({ spuId: 1 }));
  });
});

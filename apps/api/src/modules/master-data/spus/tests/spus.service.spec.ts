import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SpusRepository } from '../spus.repository';
import { SpusService } from '../spus.service';
import { ProductCategoriesService } from '../../product-categories/product-categories.service';

describe('SpusService', () => {
  let service: SpusService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    generateCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const categoriesServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpusService,
        { provide: SpusRepository, useValue: repoMock },
        { provide: ProductCategoriesService, useValue: categoriesServiceMock },
      ],
    }).compile();

    service = module.get<SpusService>(SpusService);
    jest.clearAllMocks();
  });

  it('创建 SPU 成功，自动生成 spu_code SPU001', async () => {
    categoriesServiceMock.findById
      .mockResolvedValueOnce({ id: 3, level: 3, parentId: 2 })
      .mockResolvedValueOnce({ id: 2, level: 2, parentId: 1 })
      .mockResolvedValueOnce({ id: 1, level: 1, parentId: null });
    repoMock.generateCode.mockResolvedValue('SPU001');
    repoMock.create.mockResolvedValue({ id: 1, spuCode: 'SPU001', name: '测试产品', categoryId: 3 });

    const result = await service.create({ name: '测试产品', categoryId: 3 }, 'admin');

    expect(result.spuCode).toBe('SPU001');
    expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({ spuCode: 'SPU001', name: '测试产品' }));
  });

  it('创建 SPU 时分类不存在 → NotFoundException', async () => {
    categoriesServiceMock.findById.mockRejectedValue(new NotFoundException('产品分类不存在'));

    await expect(service.create({ name: '测试', categoryId: 999 }, 'admin')).rejects.toThrow(NotFoundException);
  });

  it('创建 SPU 时分类 level=1 → BadRequestException（只能选末级）', async () => {
    categoriesServiceMock.findById.mockResolvedValue({ id: 1, level: 1, parentId: null });

    await expect(service.create({ name: '测试', categoryId: 1 }, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('创建 SPU 时分类 level=2 → BadRequestException（只能选末级）', async () => {
    categoriesServiceMock.findById.mockResolvedValue({ id: 2, level: 2, parentId: 1 });

    await expect(service.create({ name: '测试', categoryId: 2 }, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('创建 SPU 时分类 level=3 → 成功，正确推导 level1/level2 ID', async () => {
    categoriesServiceMock.findById
      .mockResolvedValueOnce({ id: 3, level: 3, parentId: 2 })
      .mockResolvedValueOnce({ id: 2, level: 2, parentId: 1 })
      .mockResolvedValueOnce({ id: 1, level: 1, parentId: null });
    repoMock.generateCode.mockResolvedValue('SPU001');
    repoMock.create.mockResolvedValue({ id: 1, spuCode: 'SPU001', categoryId: 3, categoryLevel1Id: 1, categoryLevel2Id: 2 });

    const result = await service.create({ name: '测试', categoryId: 3 }, 'admin');

    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 3, categoryLevel1Id: 1, categoryLevel2Id: 2 }),
    );
    expect(result.categoryLevel1Id).toBe(1);
    expect(result.categoryLevel2Id).toBe(2);
  });

  it('更新 SPU 名称成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, name: '旧名称', categoryId: 3, categoryLevel1Id: 1, categoryLevel2Id: 2 });
    repoMock.update.mockResolvedValue({ id: 1, name: '新名称', categoryId: 3 });

    const result = await service.update(1, { name: '新名称' }, 'admin');

    expect(result.name).toBe('新名称');
    expect(repoMock.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: '新名称', updatedBy: 'admin' }));
  });

  it('更新 SPU 时 categoryId 变更 → 重新校验并更新 level1/level2', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, name: '测试', categoryId: 3, categoryLevel1Id: 1, categoryLevel2Id: 2 });
    categoriesServiceMock.findById
      .mockResolvedValueOnce({ id: 6, level: 3, parentId: 5 })
      .mockResolvedValueOnce({ id: 5, level: 2, parentId: 4 })
      .mockResolvedValueOnce({ id: 4, level: 1, parentId: null });
    repoMock.update.mockResolvedValue({ id: 1, categoryId: 6, categoryLevel1Id: 4, categoryLevel2Id: 5 });

    const result = await service.update(1, { categoryId: 6 }, 'admin');

    expect(repoMock.update).toHaveBeenCalledWith(1, expect.objectContaining({ categoryLevel1Id: 4, categoryLevel2Id: 5 }));
  });

  it('更新不存在的 SPU → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { name: '新名称' }, 'admin')).rejects.toThrow(NotFoundException);
  });

  it('删除 SPU 成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, name: '测试' });
    repoMock.delete.mockResolvedValue(undefined);

    await expect(service.delete(1)).resolves.toBeUndefined();
    expect(repoMock.delete).toHaveBeenCalledWith(1);
  });

  it('删除不存在的 SPU → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.delete(404)).rejects.toThrow(NotFoundException);
  });
});

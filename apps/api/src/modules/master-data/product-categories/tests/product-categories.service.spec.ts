import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesRepository } from '../product-categories.repository';
import { ProductCategoriesService } from '../product-categories.service';

describe('ProductCategoriesService', () => {
  let service: ProductCategoriesService;

  const repoMock = {
    findTree: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoriesService,
        {
          provide: ProductCategoriesRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ProductCategoriesService>(ProductCategoriesService);
    jest.clearAllMocks();
  });

  it('创建一级分类，level=1', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.create.mockResolvedValue({ id: 1, name: '灯具', parentId: null, level: 1, sortOrder: 0 });

    const result = await service.create({ name: '灯具' }, 'admin');

    expect(result.level).toBe(1);
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '灯具', parentId: null, level: 1 }),
    );
  });

  it('创建二级分类（有 parentId），level=2', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.findById.mockResolvedValue({ id: 1, name: '灯具', parentId: null, level: 1 });
    repoMock.create.mockResolvedValue({ id: 2, name: '户外灯', parentId: 1, level: 2, sortOrder: 0 });

    const result = await service.create({ name: '户外灯', parentId: 1 }, 'admin');

    expect(result.level).toBe(2);
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '户外灯', parentId: 1, level: 2 }),
    );
  });

  it('创建三级分类（有 parentId），level=3', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.findById.mockResolvedValue({ id: 2, name: '户外灯', parentId: 1, level: 2 });
    repoMock.create.mockResolvedValue({ id: 3, name: '洗墙灯', parentId: 2, level: 3, sortOrder: 0 });

    const result = await service.create({ name: '洗墙灯', parentId: 2 }, 'admin');

    expect(result.level).toBe(3);
  });

  it('三级分类下创建子分类 → BadRequestException', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.findById.mockResolvedValue({ id: 3, name: '洗墙灯', parentId: 2, level: 3 });

    await expect(service.create({ name: '子分类', parentId: 3 }, 'admin')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('名称重复 → BadRequestException', async () => {
    repoMock.findByName.mockResolvedValue({ id: 99, name: '灯具' });

    await expect(service.create({ name: '灯具' }, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('parentId 不存在 → NotFoundException', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.findById.mockResolvedValue(null);

    await expect(service.create({ name: '新分类', parentId: 999 }, 'admin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('更新名称成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, name: '灯具', level: 1 });
    repoMock.findByName.mockResolvedValue(null);
    repoMock.update.mockResolvedValue({ id: 1, name: '照明设备', level: 1 });

    const result = await service.update(1, { name: '照明设备' }, 'admin');

    expect(result.name).toBe('照明设备');
    expect(repoMock.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: '照明设备', updatedBy: 'admin' }));
  });

  it('更新名称重复 → BadRequestException', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, name: '灯具', level: 1 });
    repoMock.findByName.mockResolvedValue({ id: 2, name: '户外灯' });

    await expect(service.update(1, { name: '户外灯' }, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('更新不存在分类 → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { name: '新名称' }, 'admin')).rejects.toThrow(NotFoundException);
  });
});

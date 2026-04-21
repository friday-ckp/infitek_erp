import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseOwnership, WarehouseStatus } from '@infitek/shared';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { Warehouse } from '../entities/warehouse.entity';
import { WarehousesRepository } from '../warehouses.repository';
import { WarehousesService } from '../warehouses.service';

const mockWarehouse: Warehouse = {
  id: 1,
  name: '深圳仓',
  address: '深圳市宝安区',
  status: WarehouseStatus.ACTIVE,
  warehouseCode: null,
  warehouseType: null,
  supplierId: null,
  supplierName: null,
  defaultShipProvince: null,
  defaultShipCity: null,
  ownership: WarehouseOwnership.INTERNAL,
  isVirtual: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
  updatedBy: 'admin',
};

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('WarehousesService', () => {
  let service: WarehousesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        { provide: WarehousesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('应返回分页列表', async () => {
      const result = { list: [mockWarehouse], total: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockRepo.findAll.mockResolvedValue(result);

      const res = await service.findAll({ page: 1, pageSize: 20 });
      expect(res).toEqual(result);
      expect(mockRepo.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });
  });

  describe('findById', () => {
    it('应返回仓库', async () => {
      mockRepo.findById.mockResolvedValue(mockWarehouse);
      const res = await service.findById(1);
      expect(res).toEqual(mockWarehouse);
    });

    it('仓库不存在时应抛出 NotFoundException', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('应创建仓库，默认状态为 ACTIVE', async () => {
      const dto: CreateWarehouseDto = { name: '义乌仓', address: '浙江省义乌市' };
      mockRepo.create.mockResolvedValue({ ...mockWarehouse, ...dto });

      const res = await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '义乌仓',
          address: '浙江省义乌市',
          status: WarehouseStatus.ACTIVE,
          createdBy: 'admin',
          updatedBy: 'admin',
        }),
      );
      expect(res).toBeDefined();
    });

    it('address 可选，可为 null', async () => {
      const dto: CreateWarehouseDto = { name: '测试仓' };
      mockRepo.create.mockResolvedValue({ ...mockWarehouse, name: '测试仓', address: null });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ address: null }),
      );
    });

    it('ownership 默认为 INTERNAL（内部仓）', async () => {
      const dto: CreateWarehouseDto = { name: '默认仓' };
      mockRepo.create.mockResolvedValue(mockWarehouse);

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownership: WarehouseOwnership.INTERNAL }),
      );
    });

    it('isVirtual 默认为 0', async () => {
      const dto: CreateWarehouseDto = { name: '默认仓' };
      mockRepo.create.mockResolvedValue(mockWarehouse);

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isVirtual: 0 }),
      );
    });

    it('可传入 isVirtual=1 创建虚拟仓', async () => {
      const dto: CreateWarehouseDto = { name: '虚拟仓', isVirtual: 1 };
      mockRepo.create.mockResolvedValue({ ...mockWarehouse, isVirtual: 1 });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isVirtual: 1 }),
      );
    });

    it('可传入 ownership=外部仓', async () => {
      const dto: CreateWarehouseDto = { name: '外部仓', ownership: WarehouseOwnership.EXTERNAL };
      mockRepo.create.mockResolvedValue({ ...mockWarehouse, ownership: WarehouseOwnership.EXTERNAL });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownership: WarehouseOwnership.EXTERNAL }),
      );
    });
  });

  describe('update', () => {
    it('应更新仓库', async () => {
      const dto: UpdateWarehouseDto = { name: '深圳仓-更新' };
      mockRepo.findById.mockResolvedValue(mockWarehouse);
      mockRepo.update.mockResolvedValue({ ...mockWarehouse, name: '深圳仓-更新' });

      const res = await service.update(1, dto, 'admin');
      expect(res.name).toBe('深圳仓-更新');
    });

    it('应支持禁用仓库', async () => {
      const dto: UpdateWarehouseDto = { status: WarehouseStatus.INACTIVE };
      mockRepo.findById.mockResolvedValue(mockWarehouse);
      mockRepo.update.mockResolvedValue({ ...mockWarehouse, status: WarehouseStatus.INACTIVE });

      const res = await service.update(1, dto, 'admin');
      expect(res.status).toBe(WarehouseStatus.INACTIVE);
    });

    it('仓库不存在时应抛出 NotFoundException', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update(999, {}, 'admin')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehouseOwnership, WarehouseStatus } from '@infitek/shared';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Warehouse } from './entities/warehouse.entity';
import { WarehousesRepository } from './warehouses.repository';

@Injectable()
export class WarehousesService {
  constructor(private readonly warehousesRepository: WarehousesRepository) {}

  findAll(query: QueryWarehouseDto) {
    return this.warehousesRepository.findAll(query);
  }

  async findById(id: number): Promise<Warehouse> {
    const warehouse = await this.warehousesRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }
    return warehouse;
  }

  create(dto: CreateWarehouseDto, operator?: string) {
    return this.warehousesRepository.create({
      name: dto.name,
      address: dto.address ?? null,
      status: WarehouseStatus.ACTIVE,
      warehouseCode: dto.warehouseCode ?? null,
      warehouseType: dto.warehouseType ?? null,
      supplierId: dto.supplierId ?? null,
      supplierName: dto.supplierName ?? null,
      defaultShipProvince: dto.defaultShipProvince ?? null,
      defaultShipCity: dto.defaultShipCity ?? null,
      ownership: dto.ownership ?? WarehouseOwnership.INTERNAL,
      isVirtual: dto.isVirtual ?? 0,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateWarehouseDto, operator?: string) {
    const warehouse = await this.warehousesRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }
    return this.warehousesRepository.update(id, {
      ...dto,
      updatedBy: operator,
    });
  }
}

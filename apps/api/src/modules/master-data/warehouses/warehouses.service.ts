import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehouseStatus } from '@infitek/shared';
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

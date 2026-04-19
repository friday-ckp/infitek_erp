import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UnitStatus } from '@infitek/shared';
import { CreateUnitDto } from './dto/create-unit.dto';
import { QueryUnitDto } from './dto/query-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit } from './entities/unit.entity';
import { UnitsRepository } from './units.repository';

@Injectable()
export class UnitsService {
  constructor(private readonly unitsRepository: UnitsRepository) {}

  findAll(query: QueryUnitDto) {
    return this.unitsRepository.findAll(query);
  }

  async findById(id: number): Promise<Unit> {
    const unit = await this.unitsRepository.findById(id);
    if (!unit) {
      throw new NotFoundException('单位不存在');
    }
    return unit;
  }

  async create(dto: CreateUnitDto, operator?: string) {
    const duplicate = await this.unitsRepository.findByCode(dto.code);
    if (duplicate) {
      throw new BadRequestException('单位编码已存在');
    }

    return this.unitsRepository.create({
      code: dto.code,
      name: dto.name,
      status: UnitStatus.ACTIVE,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateUnitDto, operator?: string) {
    const unit = await this.unitsRepository.findById(id);
    if (!unit) {
      throw new NotFoundException('单位不存在');
    }

    if (dto.code && dto.code !== unit.code) {
      const duplicate = await this.unitsRepository.findByCode(dto.code);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('单位编码已存在');
      }
    }

    return this.unitsRepository.update(id, {
      ...dto,
      updatedBy: operator,
    });
  }
}

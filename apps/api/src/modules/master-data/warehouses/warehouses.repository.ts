import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class WarehousesRepository {
  constructor(
    @InjectRepository(Warehouse)
    private readonly repo: Repository<Warehouse>,
  ) {}

  findById(id: number): Promise<Warehouse | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findAll(query: QueryWarehouseDto) {
    const { keyword, page = 1, pageSize = 20, status } = query;

    const qb = this.repo
      .createQueryBuilder('warehouse')
      .where('warehouse.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(warehouse.name LIKE :kw OR warehouse.address LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }

    if (status) {
      qb.andWhere('warehouse.status = :status', { status });
    }

    const [list, total] = await qb
      .orderBy('warehouse.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  create(data: Partial<Warehouse>): Promise<Warehouse> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Warehouse>): Promise<Warehouse> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id, deletedAt: IsNull() } });
  }
}

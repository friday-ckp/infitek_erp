import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { applyKeywordFilter, applyPagination } from '../../../common/utils/query-builder.util';
import { QueryUnitDto } from './dto/query-unit.dto';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsRepository {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  findById(id: number): Promise<Unit | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  findByCode(code: string): Promise<Unit | null> {
    return this.repo.findOne({ where: { code, deletedAt: IsNull() } });
  }

  async findAll(query: QueryUnitDto) {
    const { keyword, page = 1, pageSize = 20, status } = query;

    let qb = this.repo
      .createQueryBuilder('unit')
      .where('unit.deleted_at IS NULL');

    qb = applyKeywordFilter(qb, 'unit', ['name', 'code'], keyword);

    if (status) {
      qb = qb.andWhere('unit.status = :status', { status });
    }

    qb = qb.orderBy('unit.created_at', 'DESC');
    qb = applyPagination(qb, page, pageSize);

    const [list, total] = await qb.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  create(data: Partial<Unit>) {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Unit>) {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id, deletedAt: IsNull() } });
  }
}

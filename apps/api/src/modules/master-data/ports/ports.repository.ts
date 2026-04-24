import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QueryPortDto } from './dto/query-port.dto';
import { Port } from './entities/port.entity';

@Injectable()
export class PortsRepository {
  constructor(
    @InjectRepository(Port)
    private readonly repo: Repository<Port>,
  ) {}

  findById(id: number): Promise<Port | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  findByCode(portCode: string): Promise<Port | null> {
    return this.repo.findOne({ where: { portCode, deletedAt: IsNull() } });
  }

  async findAll(query: QueryPortDto) {
    const { keyword, page = 1, pageSize = 20, countryId } = query;

    const qb = this.repo.createQueryBuilder('port').where('port.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere(
        '(port.name_cn LIKE :kw OR port.name_en LIKE :kw OR port.port_code LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (countryId !== undefined) {
      qb.andWhere('port.country_id = :countryId', { countryId });
    }

    const [list, total] = await qb
      .orderBy('port.created_at', 'DESC')
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

  create(data: Partial<Port>): Promise<Port> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Port>): Promise<Port> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id, deletedAt: IsNull() } });
  }
}

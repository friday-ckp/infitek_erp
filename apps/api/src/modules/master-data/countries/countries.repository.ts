import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QueryCountryDto } from './dto/query-country.dto';
import { Country } from './entities/country.entity';

@Injectable()
export class CountriesRepository {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  findById(id: number): Promise<Country | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  findByCode(code: string): Promise<Country | null> {
    return this.repo.findOne({ where: { code, deletedAt: IsNull() } });
  }

  async findAll(query: QueryCountryDto) {
    const { keyword, page = 1, pageSize = 20 } = query;

    const qb = this.repo
      .createQueryBuilder('country')
      .where('country.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(country.name LIKE :kw OR country.code LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }

    const [list, total] = await qb
      .orderBy('country.created_at', 'DESC')
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

  create(data: Partial<Country>): Promise<Country> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Country>): Promise<Country> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id, deletedAt: IsNull() } });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryCompanyDto } from './dto/query-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesRepository {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {}

  findById(id: number): Promise<Company | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string): Promise<Company | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findAll(query: QueryCompanyDto) {
    const { keyword, page = 1, pageSize = 20 } = query;

    const qb = this.repo.createQueryBuilder('company');

    if (keyword) {
      qb.where('company.name LIKE :kw', { kw: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('company.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  create(data: Partial<Company>): Promise<Company> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Company>): Promise<Company> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}

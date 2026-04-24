import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplate } from './entities/contract-template.entity';
import { QueryContractTemplateDto } from './dto/query-contract-template.dto';
import { ContractTemplateStatus } from '@infitek/shared';

@Injectable()
export class ContractTemplatesRepository {
  constructor(
    @InjectRepository(ContractTemplate)
    private readonly repo: Repository<ContractTemplate>,
  ) {}

  async findAll(query: QueryContractTemplateDto) {
    const { keyword, page = 1, pageSize = 20, status } = query;
    const qb = this.repo.createQueryBuilder('contractTemplate');

    if (keyword) {
      qb.where(
        '(contractTemplate.name LIKE :kw OR contractTemplate.description LIKE :kw OR contractTemplate.content LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (status) {
      qb.andWhere('contractTemplate.status = :status', { status });
    }

    const [list, total] = await qb
      .orderBy('contractTemplate.createdAt', 'DESC')
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

  findById(id: number): Promise<ContractTemplate | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string): Promise<ContractTemplate | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findDefaultApproved(): Promise<ContractTemplate | null> {
    return this.repo.findOne({
      where: {
        isDefault: 1,
        status: ContractTemplateStatus.APPROVED,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async clearDefaultFlag(excludeId?: number): Promise<void> {
    const qb = this.repo
      .createQueryBuilder()
      .update(ContractTemplate)
      .set({ isDefault: 0 })
      .where('is_default = :flag', { flag: 1 });

    if (excludeId) {
      qb.andWhere('id != :excludeId', { excludeId });
    }

    await qb.execute();
  }

  create(data: Partial<ContractTemplate>): ContractTemplate {
    return this.repo.create(data);
  }

  save(entity: ContractTemplate): Promise<ContractTemplate> {
    return this.repo.save(entity);
  }
}

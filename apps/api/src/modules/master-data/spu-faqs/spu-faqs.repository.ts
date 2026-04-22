import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpuFaq } from './entities/spu-faq.entity';

@Injectable()
export class SpuFaqsRepository {
  constructor(
    @InjectRepository(SpuFaq)
    private readonly repo: Repository<SpuFaq>,
  ) {}

  findBySpu(spuId: number): Promise<SpuFaq[]> {
    return this.repo.find({
      where: { spuId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findById(id: number): Promise<SpuFaq | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<SpuFaq>): Promise<SpuFaq> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<SpuFaq>): Promise<SpuFaq> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

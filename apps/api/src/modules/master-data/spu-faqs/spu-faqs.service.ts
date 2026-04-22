import { Injectable, NotFoundException } from '@nestjs/common';
import { SpuFaqsRepository } from './spu-faqs.repository';
import { SpusService } from '../spus/spus.service';
import { CreateSpuFaqDto } from './dto/create-spu-faq.dto';
import { UpdateSpuFaqDto } from './dto/update-spu-faq.dto';
import { SpuFaq } from './entities/spu-faq.entity';

@Injectable()
export class SpuFaqsService {
  constructor(
    private readonly repo: SpuFaqsRepository,
    private readonly spusService: SpusService,
  ) {}

  findBySpu(spuId: number): Promise<SpuFaq[]> {
    return this.repo.findBySpu(spuId);
  }

  async create(dto: CreateSpuFaqDto, operator?: string): Promise<SpuFaq> {
    await this.spusService.findById(dto.spuId);

    return this.repo.create({
      spuId: dto.spuId,
      question: dto.question,
      answer: dto.answer,
      sortOrder: dto.sortOrder ?? 0,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateSpuFaqDto, operator?: string): Promise<SpuFaq> {
    const faq = await this.repo.findById(id);
    if (!faq) throw new NotFoundException('FAQ 不存在');
    return this.repo.update(id, { ...dto, updatedBy: operator });
  }

  async delete(id: number): Promise<void> {
    const faq = await this.repo.findById(id);
    if (!faq) throw new NotFoundException('FAQ 不存在');
    await this.repo.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductDocument } from './entities/product-document.entity';
import { QueryProductDocumentDto } from './dto/query-product-document.dto';

@Injectable()
export class ProductDocumentsRepository {
  constructor(
    @InjectRepository(ProductDocument)
    private readonly repo: Repository<ProductDocument>,
  ) {}

  async findAll(query: QueryProductDocumentDto) {
    const { keyword, page = 1, pageSize = 20, documentType, attributionType, spuId, countryId } = query;
    const qb = this.repo.createQueryBuilder('d');

    if (keyword) {
      qb.where('d.document_name LIKE :kw', { kw: `%${keyword}%` });
    }
    if (documentType) qb.andWhere('d.document_type = :documentType', { documentType });
    if (attributionType) qb.andWhere('d.attribution_type = :attributionType', { attributionType });
    if (spuId !== undefined) qb.andWhere('d.spu_id = :spuId', { spuId });
    if (countryId !== undefined) qb.andWhere('d.country_id = :countryId', { countryId });

    const [list, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  findById(id: number): Promise<ProductDocument | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<ProductDocument>): ProductDocument {
    return this.repo.create(data);
  }

  save(entity: ProductDocument): Promise<ProductDocument> {
    return this.repo.save(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

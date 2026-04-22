import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { QueryCertificateDto } from './dto/query-certificate.dto';
import { CertificateStatus } from '@infitek/shared';

@Injectable()
export class CertificatesRepository {
  constructor(
    @InjectRepository(Certificate)
    private readonly repo: Repository<Certificate>,
  ) {}

  async findAll(query: QueryCertificateDto) {
    const { keyword, page = 1, pageSize = 20, certificateType, status, categoryId } = query;
    const qb = this.repo.createQueryBuilder('c').leftJoinAndSelect('c.spus', 'spus');

    if (keyword) {
      qb.where('(c.certificate_name LIKE :kw OR c.certificate_no LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (certificateType) {
      qb.andWhere('c.certificate_type = :certificateType', { certificateType });
    }
    if (categoryId !== undefined) {
      qb.andWhere('c.category_id = :categoryId', { categoryId });
    }
    if (status === CertificateStatus.VALID) {
      qb.andWhere('c.valid_until >= CURDATE()');
    } else if (status === CertificateStatus.EXPIRED) {
      qb.andWhere('c.valid_until < CURDATE()');
    }

    const [list, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  findById(id: number): Promise<Certificate | null> {
    return this.repo.findOne({ where: { id }, relations: ['spus'] });
  }

  findByNo(certificateNo: string): Promise<Certificate | null> {
    return this.repo.findOne({ where: { certificateNo } });
  }

  async generateCode(): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('c')
      .select('MAX(CAST(SUBSTRING(c.certificate_no, 5) AS UNSIGNED))', 'maxSeq')
      .where('c.certificate_no LIKE :prefix', { prefix: 'CERT%' })
      .getRawOne<{ maxSeq: number | null }>();
    const nextSeq = (result?.maxSeq ?? 0) + 1;
    return `CERT${String(nextSeq).padStart(3, '0')}`;
  }

  save(entity: Certificate): Promise<Certificate> {
    return this.repo.save(entity);
  }

  create(data: Partial<Certificate>): Certificate {
    return this.repo.create(data);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { SupplierPaymentTerm } from './entities/supplier-payment-term.entity';

@Injectable()
export class SuppliersRepository {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierPaymentTerm)
    private readonly paymentTermRepo: Repository<SupplierPaymentTerm>,
  ) {}

  async findAll(query: QuerySupplierDto) {
    const { keyword, page = 1, pageSize = 20, status } = query;
    const qb = this.supplierRepo.createQueryBuilder('supplier');

    if (keyword) {
      qb.where(
        `(
          supplier.name LIKE :kw OR
          supplier.short_name LIKE :kw OR
          supplier.contact_person LIKE :kw OR
          supplier.contact_phone LIKE :kw OR
          supplier.contact_email LIKE :kw OR
          supplier.supplier_code LIKE :kw
        )`,
        { kw: `%${keyword}%` },
      );
    }

    if (status) {
      qb.andWhere('supplier.status = :status', { status });
    }

    const [list, total] = await qb
      .orderBy('supplier.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    if (!list.length) {
      return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    const suppliersWithRelations = await this.supplierRepo.find({
      where: { id: In(list.map((item) => item.id)) },
      relations: ['paymentTerms'],
      order: {
        createdAt: 'DESC',
        paymentTerms: {
          createdAt: 'ASC',
        },
      },
    });

    const supplierMap = new Map(suppliersWithRelations.map((item) => [item.id, item]));
    return {
      list: list.map((item) => supplierMap.get(item.id) ?? item),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findById(id: number): Promise<Supplier | null> {
    return this.supplierRepo.findOne({
      where: { id },
      relations: ['paymentTerms'],
      order: {
        paymentTerms: {
          createdAt: 'ASC',
        },
      },
    });
  }

  findByName(name: string): Promise<Supplier | null> {
    return this.supplierRepo.findOne({ where: { name } });
  }
  async generateCode(): Promise<string> {
    const result = await this.supplierRepo
      .createQueryBuilder('supplier')
      .select('MAX(CAST(SUBSTRING(supplier.supplier_code, 5) AS UNSIGNED))', 'maxSeq')
      .where('supplier.supplier_code LIKE :prefix', { prefix: 'YCCG%' })
      .getRawOne<{ maxSeq: number | null }>();

    const nextSeq = (result?.maxSeq ?? 0) + 1;
    return `YCCG${String(nextSeq).padStart(4, '0')}`;
  }

  create(data: Partial<Supplier>): Supplier {
    return this.supplierRepo.create(data);
  }

  save(entity: Supplier): Promise<Supplier> {
    return this.supplierRepo.save(entity);
  }

  async replacePaymentTerms(
    supplierId: number,
    paymentTerms: Array<Partial<SupplierPaymentTerm>>,
  ): Promise<SupplierPaymentTerm[]> {
    await this.paymentTermRepo.delete({ supplierId });
    if (!paymentTerms.length) {
      return [];
    }

    const entities = this.paymentTermRepo.create(
      paymentTerms.map((paymentTerm) => ({
        ...paymentTerm,
        supplierId,
      })),
    );
    return this.paymentTermRepo.save(entities);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { ShippingDemandStatus } from '@infitek/shared';
import { QueryShippingDemandDto } from './dto/query-shipping-demand.dto';
import { ShippingDemandItem } from './entities/shipping-demand-item.entity';
import { ShippingDemand } from './entities/shipping-demand.entity';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

@Injectable()
export class ShippingDemandsRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ShippingDemand)
    private readonly shippingDemandRepo: Repository<ShippingDemand>,
    @InjectRepository(ShippingDemandItem)
    private readonly shippingDemandItemRepo: Repository<ShippingDemandItem>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  findById(id: number): Promise<ShippingDemand | null> {
    return this.shippingDemandRepo.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  async findAll(query: QueryShippingDemandDto) {
    const {
      keyword,
      status,
      customerId,
      salesOrderId,
      sourceDocumentCode,
      page = 1,
      pageSize = 20,
    } = query;
    const qb = this.shippingDemandRepo.createQueryBuilder('demand');

    if (keyword) {
      qb.andWhere(
        '(demand.demand_code LIKE :kw OR demand.source_document_code LIKE :kw OR demand.customer_name LIKE :kw OR demand.customer_code LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (status) {
      qb.andWhere('demand.status = :status', { status });
    }

    if (customerId != null) {
      qb.andWhere('demand.customer_id = :customerId', { customerId });
    }

    if (salesOrderId != null) {
      qb.andWhere('demand.sales_order_id = :salesOrderId', { salesOrderId });
    }

    const normalizedSourceDocumentCode = sourceDocumentCode?.trim();
    if (normalizedSourceDocumentCode) {
      qb.andWhere('demand.source_document_code LIKE :sourceDocumentCode ESCAPE \'\\\\\'', {
        sourceDocumentCode: `%${escapeLike(normalizedSourceDocumentCode)}%`,
      });
    }

    const [list, total] = await qb
      .loadRelationCountAndMap('demand.skuCount', 'demand.items')
      .orderBy('demand.created_at', 'DESC')
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

  findActiveBySalesOrderId(salesOrderId: number): Promise<ShippingDemand | null> {
    return this.shippingDemandRepo.findOne({
      where: {
        salesOrderId,
        status: Not(ShippingDemandStatus.VOIDED),
      },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  async update(
    id: number,
    data: Partial<ShippingDemand>,
  ): Promise<ShippingDemand> {
    await this.shippingDemandRepo.update(id, data);
    return this.findById(id).then((item) => item as ShippingDemand);
  }

  getItemRepository(): Repository<ShippingDemandItem> {
    return this.shippingDemandItemRepo;
  }
}

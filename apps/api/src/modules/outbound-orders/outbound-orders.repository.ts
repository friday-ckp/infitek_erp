import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OutboundAllocationConsumption } from './entities/outbound-allocation-consumption.entity';
import { OutboundOrderItem } from './entities/outbound-order-item.entity';
import { OutboundOrder } from './entities/outbound-order.entity';
import { QueryOutboundOrderDto } from './dto/query-outbound-order.dto';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

@Injectable()
export class OutboundOrdersRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(OutboundOrder)
    private readonly outboundOrderRepo: Repository<OutboundOrder>,
    @InjectRepository(OutboundOrderItem)
    private readonly outboundOrderItemRepo: Repository<OutboundOrderItem>,
    @InjectRepository(OutboundAllocationConsumption)
    private readonly outboundAllocationConsumptionRepo: Repository<OutboundAllocationConsumption>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  findBySourceActionKey(sourceActionKey: string): Promise<OutboundOrder | null> {
    return this.outboundOrderRepo.findOne({
      where: { sourceActionKey },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  findById(id: number): Promise<OutboundOrder | null> {
    return this.outboundOrderRepo.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { id: 'ASC' } },
    });
  }

  async findAll(query: QueryOutboundOrderDto) {
    const {
      keyword,
      status,
      outboundType,
      logisticsOrderId,
      shippingDemandId,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.outboundOrderRepo.createQueryBuilder('outboundOrder');
    const normalizedKeyword = keyword?.trim();

    if (normalizedKeyword) {
      qb.andWhere(
        `(outboundOrder.outbound_code LIKE :kw ESCAPE '\\\\'
          OR outboundOrder.logistics_order_code LIKE :kw ESCAPE '\\\\'
          OR outboundOrder.shipping_demand_code LIKE :kw ESCAPE '\\\\'
          OR outboundOrder.sales_order_code LIKE :kw ESCAPE '\\\\'
          OR outboundOrder.outbound_user_name LIKE :kw ESCAPE '\\\\'
          OR outboundOrder.warehouse_name LIKE :kw ESCAPE '\\\\')`,
        { kw: `%${escapeLike(normalizedKeyword)}%` },
      );
    }

    if (status) {
      qb.andWhere('outboundOrder.status = :status', { status });
    }

    if (outboundType) {
      qb.andWhere('outboundOrder.outbound_type = :outboundType', {
        outboundType,
      });
    }

    if (logisticsOrderId != null) {
      qb.andWhere('outboundOrder.logistics_order_id = :logisticsOrderId', {
        logisticsOrderId,
      });
    }

    if (shippingDemandId != null) {
      qb.andWhere('outboundOrder.shipping_demand_id = :shippingDemandId', {
        shippingDemandId,
      });
    }

    const [list, total] = await qb
      .orderBy('outboundOrder.created_at', 'DESC')
      .addOrderBy('outboundOrder.id', 'DESC')
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
}

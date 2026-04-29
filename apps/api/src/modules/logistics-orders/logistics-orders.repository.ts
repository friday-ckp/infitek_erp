import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { LogisticsOrderStatus } from '@infitek/shared';
import { QueryLogisticsOrderDto } from './dto/query-logistics-order.dto';
import { LogisticsOrderItem } from './entities/logistics-order-item.entity';
import { LogisticsOrderPackage } from './entities/logistics-order-package.entity';
import { LogisticsOrder } from './entities/logistics-order.entity';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

@Injectable()
export class LogisticsOrdersRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(LogisticsOrder)
    private readonly logisticsOrderRepo: Repository<LogisticsOrder>,
    @InjectRepository(LogisticsOrderItem)
    private readonly logisticsOrderItemRepo: Repository<LogisticsOrderItem>,
    @InjectRepository(LogisticsOrderPackage)
    private readonly logisticsOrderPackageRepo: Repository<LogisticsOrderPackage>,
  ) {}

  createQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  findById(id: number): Promise<LogisticsOrder | null> {
    return this.logisticsOrderRepo.findOne({
      where: { id },
      relations: { items: true, packages: true },
      order: { items: { id: 'ASC' }, packages: { id: 'ASC' } },
    });
  }

  async findAll(query: QueryLogisticsOrderDto) {
    const { keyword, shippingDemandId, page = 1, pageSize = 20 } = query;
    const qb = this.logisticsOrderRepo.createQueryBuilder('logisticsOrder');

    const normalizedKeyword = keyword?.trim();
    if (normalizedKeyword) {
      qb.andWhere(
        '(logisticsOrder.order_code LIKE :kw OR logisticsOrder.shipping_demand_code LIKE :kw OR logisticsOrder.sales_order_code LIKE :kw OR logisticsOrder.customer_name LIKE :kw)',
        { kw: `%${escapeLike(normalizedKeyword)}%` },
      );
    }

    if (shippingDemandId != null) {
      qb.andWhere('logisticsOrder.shipping_demand_id = :shippingDemandId', {
        shippingDemandId,
      });
    }

    const [list, total] = await qb
      .loadRelationCountAndMap(
        'logisticsOrder.itemCount',
        'logisticsOrder.items',
      )
      .orderBy('logisticsOrder.created_at', 'DESC')
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

  async sumActivePlannedQuantityByDemandItemIds(
    demandItemIds: number[],
  ): Promise<Map<number, number>> {
    if (!demandItemIds.length) return new Map();
    const rows = await this.logisticsOrderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.logisticsOrder', 'logisticsOrder')
      .select('item.shipping_demand_item_id', 'shippingDemandItemId')
      .addSelect('SUM(item.planned_quantity)', 'plannedQuantity')
      .where('item.shipping_demand_item_id IN (:...demandItemIds)', {
        demandItemIds,
      })
      .andWhere('logisticsOrder.status != :cancelled', {
        cancelled: LogisticsOrderStatus.CANCELLED,
      })
      .groupBy('item.shipping_demand_item_id')
      .getRawMany<{
        shippingDemandItemId: string;
        plannedQuantity: string;
      }>();

    return new Map(
      rows.map((row) => [
        Number(row.shippingDemandItemId),
        Number(row.plannedQuantity ?? 0),
      ]),
    );
  }

  async findActiveByShippingDemandId(
    shippingDemandId: number,
  ): Promise<LogisticsOrder[]> {
    return this.logisticsOrderRepo.find({
      where: {
        shippingDemandId,
        status: In([
          LogisticsOrderStatus.CONFIRMED,
          LogisticsOrderStatus.SHIPPED,
          LogisticsOrderStatus.DELIVERED,
        ]),
      },
      relations: { items: true },
      order: { id: 'ASC', items: { id: 'ASC' } },
    });
  }
}

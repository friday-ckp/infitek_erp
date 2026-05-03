import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OutboundAllocationConsumption } from './entities/outbound-allocation-consumption.entity';
import { OutboundOrderItem } from './entities/outbound-order-item.entity';
import { OutboundOrder } from './entities/outbound-order.entity';

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
}

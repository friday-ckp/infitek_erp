import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { SalesOrderExpense } from './entities/sales-order-expense.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';

@Injectable()
export class SalesOrdersRepository {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private readonly salesOrderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(SalesOrderExpense)
    private readonly salesOrderExpenseRepo: Repository<SalesOrderExpense>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findById(id: number): Promise<SalesOrder | null> {
    return this.salesOrderRepo.findOne({
      where: { id },
      relations: {
        items: true,
        expenses: true,
      },
      order: {
        items: { id: 'ASC' },
        expenses: { id: 'ASC' },
      },
    });
  }

  findByExternalOrderCode(externalOrderCode: string): Promise<SalesOrder | null> {
    return this.salesOrderRepo.findOne({ where: { externalOrderCode } });
  }

  async findAll(query: QuerySalesOrderDto) {
    const { keyword, customerId, status, orderType, page = 1, pageSize = 20 } = query;
    const qb = this.salesOrderRepo.createQueryBuilder('salesOrder');

    if (keyword) {
      qb.andWhere(
        '(salesOrder.erp_sales_order_code LIKE :kw OR salesOrder.external_order_code LIKE :kw OR salesOrder.customer_name LIKE :kw OR salesOrder.customer_code LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (customerId != null) {
      qb.andWhere('salesOrder.customer_id = :customerId', { customerId });
    }

    if (status) {
      qb.andWhere('salesOrder.status = :status', { status });
    }

    if (orderType) {
      qb.andWhere('salesOrder.order_type = :orderType', { orderType });
    }

    const [list, total] = await qb
      .orderBy('salesOrder.created_at', 'DESC')
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

  async generateErpOrderCode(date: Date = new Date()): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `SO${year}${month}${day}`;

    const latest = await this.salesOrderRepo
      .createQueryBuilder('salesOrder')
      .where('salesOrder.erp_sales_order_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('salesOrder.erp_sales_order_code', 'DESC')
      .getOne();

    const lastNumber = latest?.erpSalesOrderCode
      ? Number(latest.erpSalesOrderCode.slice(prefix.length))
      : 0;
    const nextNumber = String(lastNumber + 1).padStart(5, '0');
    return `${prefix}${nextNumber}`;
  }

  async createWithRelations(
    salesOrderData: Partial<SalesOrder>,
    items: Partial<SalesOrderItem>[],
    expenses: Partial<SalesOrderExpense>[],
  ): Promise<SalesOrder> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(SalesOrder);
      const itemRepository = manager.getRepository(SalesOrderItem);
      const expenseRepository = manager.getRepository(SalesOrderExpense);

      const savedOrder = await orderRepository.save(orderRepository.create(salesOrderData));

      if (items.length > 0) {
        const preparedItems = items.map((item) =>
          itemRepository.create({
            ...item,
            salesOrderId: savedOrder.id,
          }),
        );
        await itemRepository.save(preparedItems);
      }

      if (expenses.length > 0) {
        const preparedExpenses = expenses.map((expense) =>
          expenseRepository.create({
            ...expense,
            salesOrderId: savedOrder.id,
          }),
        );
        await expenseRepository.save(preparedExpenses);
      }

      return orderRepository.findOneOrFail({
        where: { id: savedOrder.id },
        relations: {
          items: true,
          expenses: true,
        },
        order: {
          items: { id: 'ASC' },
          expenses: { id: 'ASC' },
        },
      });
    });
  }

  async update(id: number, data: Partial<SalesOrder>): Promise<SalesOrder> {
    await this.salesOrderRepo.update(id, data);
    return this.findById(id).then((item) => item as SalesOrder);
  }

  getItemRepository(): Repository<SalesOrderItem> {
    return this.salesOrderItemRepo;
  }

  getExpenseRepository(): Repository<SalesOrderExpense> {
    return this.salesOrderExpenseRepo;
  }
}

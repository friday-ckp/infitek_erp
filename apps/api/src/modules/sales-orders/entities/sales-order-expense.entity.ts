import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SalesOrder } from './sales-order.entity';

@Entity('sales_order_expenses')
@Index('idx_sales_order_expenses_order_id', ['salesOrderId'])
export class SalesOrderExpense extends BaseEntity {
  @Column({ name: 'sales_order_id', type: 'bigint' })
  @Expose()
  salesOrderId: number;

  @ManyToOne(() => SalesOrder, (salesOrder) => salesOrder.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder?: SalesOrder;

  @Column({ name: 'expense_name', type: 'varchar', length: 255 })
  @Expose()
  expenseName: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  amount: string;
}

import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { OutboundOrderStatus, OutboundOrderType } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LogisticsOrder } from '../../logistics-orders/entities/logistics-order.entity';
import { OutboundOrderItem } from './outbound-order-item.entity';

@Entity('outbound_orders')
@Unique('uq_outbound_orders_outbound_code', ['outboundCode'])
@Unique('uq_outbound_orders_source_action_key', ['sourceActionKey'])
@Index('idx_outbound_orders_logistics_order_id', ['logisticsOrderId'])
@Index('idx_outbound_orders_shipping_demand_id', ['shippingDemandId'])
@Index('idx_outbound_orders_sales_order_id', ['salesOrderId'])
@Index('idx_outbound_orders_status', ['status'])
export class OutboundOrder extends BaseEntity {
  @Column({ name: 'outbound_code', type: 'varchar', length: 40 })
  @Expose()
  outboundCode: string;

  @Column({ name: 'logistics_order_id', type: 'bigint', unsigned: true })
  @Expose()
  logisticsOrderId: number;

  @ManyToOne(() => LogisticsOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'logistics_order_id' })
  logisticsOrder?: LogisticsOrder;

  @Column({ name: 'logistics_order_code', type: 'varchar', length: 40 })
  @Expose()
  logisticsOrderCode: string;

  @Column({ name: 'shipping_demand_id', type: 'bigint', unsigned: true })
  @Expose()
  shippingDemandId: number;

  @Column({ name: 'shipping_demand_code', type: 'varchar', length: 40 })
  @Expose()
  shippingDemandCode: string;

  @Column({ name: 'sales_order_id', type: 'bigint', unsigned: true })
  @Expose()
  salesOrderId: number;

  @Column({ name: 'sales_order_code', type: 'varchar', length: 40 })
  @Expose()
  salesOrderCode: string;

  @Column({ name: 'outbound_user_id', type: 'bigint', unsigned: true })
  @Expose()
  outboundUserId: number;

  @Column({ name: 'outbound_user_name', type: 'varchar', length: 100 })
  @Expose()
  outboundUserName: string;

  @Column({ name: 'outbound_date', type: 'date' })
  @Expose()
  outboundDate: string;

  @Column({ name: 'outbound_type', type: 'varchar', length: 40 })
  @Expose()
  outboundType: OutboundOrderType;

  @Column({ name: 'sales_company_id', type: 'bigint', unsigned: true })
  @Expose()
  salesCompanyId: number;

  @Column({ name: 'sales_company_name', type: 'varchar', length: 200 })
  @Expose()
  salesCompanyName: string;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'warehouse_name', type: 'varchar', length: 200 })
  @Expose()
  warehouseName: string;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  @Expose()
  status: OutboundOrderStatus;

  @Column({
    name: 'sales_total_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  salesTotalAmount: string;

  @Column({
    name: 'cost_total_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  costTotalAmount: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  @Expose()
  remark: string | null;

  @Column({
    name: 'source_action_key',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  @Expose()
  sourceActionKey: string | null;

  @OneToMany(() => OutboundOrderItem, (item) => item.outboundOrder, {
    cascade: false,
  })
  @Expose()
  items?: OutboundOrderItem[];
}

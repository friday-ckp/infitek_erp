import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
import { LogisticsOrder } from './logistics-order.entity';

@Entity('logistics_order_items')
@Index('idx_logistics_order_items_order_id', ['logisticsOrderId'])
@Index('idx_logistics_order_items_demand_item_id', ['shippingDemandItemId'])
@Index('idx_logistics_order_items_sku_id', ['skuId'])
export class LogisticsOrderItem extends BaseEntity {
  @Column({ name: 'logistics_order_id', type: 'bigint', unsigned: true })
  @Expose()
  logisticsOrderId: number;

  @ManyToOne(() => LogisticsOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'logistics_order_id' })
  logisticsOrder?: LogisticsOrder;

  @Column({ name: 'shipping_demand_item_id', type: 'bigint', unsigned: true })
  @Expose()
  shippingDemandItemId: number;

  @ManyToOne(() => ShippingDemandItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shipping_demand_item_id' })
  shippingDemandItem?: ShippingDemandItem;

  @Column({ name: 'sales_order_item_id', type: 'bigint', unsigned: true })
  @Expose()
  salesOrderItemId: number;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @Column({ name: 'sku_code', type: 'varchar', length: 100 })
  @Expose()
  skuCode: string;

  @Column({
    name: 'product_name_cn',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  productNameCn: string | null;

  @Column({
    name: 'product_name_en',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  productNameEn: string | null;

  @Column({
    name: 'sku_specification',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  skuSpecification: string | null;

  @Column({ name: 'unit_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  unitId: number | null;

  @Column({ name: 'unit_name', type: 'varchar', length: 50, nullable: true })
  @Expose()
  unitName: string | null;

  @Column({ name: 'locked_remaining_quantity', type: 'int', default: 0 })
  @Expose()
  lockedRemainingQuantity: number;

  @Column({ name: 'planned_quantity', type: 'int', default: 0 })
  @Expose()
  plannedQuantity: number;

  @Column({ name: 'outbound_quantity', type: 'int', default: 0 })
  @Expose()
  outboundQuantity: number;
}

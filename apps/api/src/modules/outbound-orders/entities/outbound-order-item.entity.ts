import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LogisticsOrderItem } from '../../logistics-orders/entities/logistics-order-item.entity';
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
import { OutboundOrder } from './outbound-order.entity';

@Entity('outbound_order_items')
@Index('idx_outbound_order_items_outbound_order_id', ['outboundOrderId'])
@Index('idx_outbound_order_items_logistics_order_item_id', ['logisticsOrderItemId'])
@Index('idx_outbound_order_items_shipping_demand_item_id', ['shippingDemandItemId'])
@Index('idx_outbound_order_items_sku_id', ['skuId'])
@Index('idx_outbound_order_items_warehouse_id', ['warehouseId'])
export class OutboundOrderItem extends BaseEntity {
  @Column({ name: 'outbound_order_id', type: 'bigint', unsigned: true })
  @Expose()
  outboundOrderId: number;

  @ManyToOne(() => OutboundOrder, (outboundOrder) => outboundOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outbound_order_id' })
  outboundOrder?: OutboundOrder;

  @Column({ name: 'logistics_order_item_id', type: 'bigint', unsigned: true })
  @Expose()
  logisticsOrderItemId: number;

  @ManyToOne(() => LogisticsOrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'logistics_order_item_id' })
  logisticsOrderItem?: LogisticsOrderItem;

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
    name: 'unit_name',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Expose()
  unitName: string | null;

  @Column({ name: 'planned_quantity', type: 'int', default: 0 })
  @Expose()
  plannedQuantity: number;

  @Column({ name: 'previous_outbound_quantity', type: 'int', default: 0 })
  @Expose()
  previousOutboundQuantity: number;

  @Column({ name: 'outbound_quantity', type: 'int', default: 0 })
  @Expose()
  outboundQuantity: number;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'warehouse_name', type: 'varchar', length: 200 })
  @Expose()
  warehouseName: string;
}

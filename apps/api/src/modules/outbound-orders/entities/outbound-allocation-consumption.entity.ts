import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ShippingDemandInventoryAllocation } from '../../shipping-demands/entities/shipping-demand-inventory-allocation.entity';
import { OutboundOrderItem } from './outbound-order-item.entity';

@Entity('outbound_allocation_consumptions')
@Index('idx_outbound_alloc_consumptions_outbound_item_id', ['outboundOrderItemId'])
@Index('idx_outbound_alloc_consumptions_allocation_id', ['shippingDemandAllocationId'])
@Index('uq_outbound_alloc_consumptions_item_allocation', [
  'outboundOrderItemId',
  'shippingDemandAllocationId',
])
export class OutboundAllocationConsumption extends BaseEntity {
  @Column({ name: 'outbound_order_item_id', type: 'bigint', unsigned: true })
  @Expose()
  outboundOrderItemId: number;

  @ManyToOne(() => OutboundOrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outbound_order_item_id' })
  outboundOrderItem?: OutboundOrderItem;

  @Column({
    name: 'shipping_demand_allocation_id',
    type: 'bigint',
    unsigned: true,
  })
  @Expose()
  shippingDemandAllocationId: number;

  @ManyToOne(() => ShippingDemandInventoryAllocation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shipping_demand_allocation_id' })
  shippingDemandAllocation?: ShippingDemandInventoryAllocation;

  @Column({ name: 'inventory_batch_id', type: 'bigint', unsigned: true })
  @Expose()
  inventoryBatchId: number;

  @Column({ name: 'consumed_quantity', type: 'int', default: 0 })
  @Expose()
  consumedQuantity: number;
}

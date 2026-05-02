import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LogisticsOrderItem } from './logistics-order-item.entity';
import { LogisticsOrder } from './logistics-order.entity';

@Entity('logistics_order_packages')
@Index('idx_logistics_order_packages_order_id', ['logisticsOrderId'])
@Index('idx_logistics_order_packages_item_id', ['logisticsOrderItemId'])
@Index('idx_logistics_order_packages_demand_item_id', ['shippingDemandItemId'])
@Index('idx_logistics_order_packages_sku_id', ['skuId'])
export class LogisticsOrderPackage extends BaseEntity {
  @Column({ name: 'logistics_order_id', type: 'bigint', unsigned: true })
  @Expose()
  logisticsOrderId: number;

  @ManyToOne(() => LogisticsOrder, (order) => order.packages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'logistics_order_id' })
  logisticsOrder?: LogisticsOrder;

  @Column({
    name: 'logistics_order_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  logisticsOrderItemId: number | null;

  @ManyToOne(() => LogisticsOrderItem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'logistics_order_item_id' })
  logisticsOrderItem?: LogisticsOrderItem;

  @Column({
    name: 'shipping_demand_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  shippingDemandItemId: number | null;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  skuId: number | null;

  @Column({ name: 'sku_code', type: 'varchar', length: 100, nullable: true })
  @Expose()
  skuCode: string | null;

  @Column({ name: 'package_no', type: 'varchar', length: 80 })
  @Expose()
  packageNo: string;

  @Column({ name: 'quantity_per_box', type: 'int', default: 0 })
  @Expose()
  quantityPerBox: number;

  @Column({ name: 'box_count', type: 'int', default: 0 })
  @Expose()
  boxCount: number;

  @Column({ name: 'total_quantity', type: 'int', default: 0 })
  @Expose()
  totalQuantity: number;

  @Column({
    name: 'length_cm',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  @Expose()
  lengthCm: string | null;

  @Column({
    name: 'width_cm',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  @Expose()
  widthCm: string | null;

  @Column({
    name: 'height_cm',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  @Expose()
  heightCm: string | null;

  @Column({
    name: 'gross_weight_kg',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  @Expose()
  grossWeightKg: string | null;

  @Column({ name: 'remarks', type: 'varchar', length: 255, nullable: true })
  @Expose()
  remarks: string | null;
}

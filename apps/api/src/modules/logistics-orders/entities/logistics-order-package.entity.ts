import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LogisticsOrder } from './logistics-order.entity';

@Entity('logistics_order_packages')
@Index('idx_logistics_order_packages_order_id', ['logisticsOrderId'])
export class LogisticsOrderPackage extends BaseEntity {
  @Column({ name: 'logistics_order_id', type: 'bigint', unsigned: true })
  @Expose()
  logisticsOrderId: number;

  @ManyToOne(() => LogisticsOrder, (order) => order.packages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'logistics_order_id' })
  logisticsOrder?: LogisticsOrder;

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

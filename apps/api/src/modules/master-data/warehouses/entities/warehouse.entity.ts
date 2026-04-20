import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { Expose } from 'class-transformer';
import { WarehouseStatus, WarehouseType, WarehouseOwnership } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Expose()
  name: string;

  @Column({ name: 'address', type: 'varchar', length: 255, nullable: true })
  @Expose()
  address: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: Object.values(WarehouseStatus),
    default: WarehouseStatus.ACTIVE,
  })
  @Expose()
  status: WarehouseStatus;

  @Column({ name: 'warehouse_code', type: 'varchar', length: 50, nullable: true })
  @Expose()
  warehouseCode: string | null;

  @Column({
    name: 'warehouse_type',
    type: 'enum',
    enum: Object.values(WarehouseType),
    nullable: true,
  })
  @Expose()
  warehouseType: WarehouseType | null;

  @Column({ name: 'supplier_id', type: 'bigint', nullable: true })
  @Expose()
  supplierId: number | null;

  @Column({ name: 'supplier_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  supplierName: string | null;

  @Column({ name: 'default_ship_province', type: 'varchar', length: 50, nullable: true })
  @Expose()
  defaultShipProvince: string | null;

  @Column({ name: 'default_ship_city', type: 'varchar', length: 50, nullable: true })
  @Expose()
  defaultShipCity: string | null;

  @Column({
    name: 'ownership',
    type: 'enum',
    enum: Object.values(WarehouseOwnership),
    default: WarehouseOwnership.INTERNAL,
  })
  @Expose()
  ownership: WarehouseOwnership;

  @Column({ name: 'is_virtual', type: 'tinyint', width: 1, default: 0 })
  @Expose()
  isVirtual: number;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

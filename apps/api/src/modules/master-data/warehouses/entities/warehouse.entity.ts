import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { Expose } from 'class-transformer';
import { WarehouseStatus } from '@infitek/shared';
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

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

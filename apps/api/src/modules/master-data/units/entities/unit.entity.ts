import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { UnitStatus } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('units')
export class Unit extends BaseEntity {
  @Index('idx_units_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 50 })
  @Expose()
  code: string;

  @Index('idx_units_name')
  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Expose()
  name: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: Object.values(UnitStatus),
    default: UnitStatus.ACTIVE,
  })
  @Expose()
  status: UnitStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

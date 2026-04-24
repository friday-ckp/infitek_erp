import { Column, DeleteDateColumn, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { PortType } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('ports')
@Unique('idx_ports_code', ['portCode'])
@Index('idx_ports_country_id', ['countryId'])
export class Port extends BaseEntity {
  @Column({
    name: 'port_type',
    type: 'enum',
    enum: Object.values(PortType),
    nullable: false,
  })
  @Expose()
  portType: PortType;

  @Column({ name: 'port_code', type: 'varchar', length: 50 })
  @Expose()
  portCode: string;

  @Column({ name: 'name_cn', type: 'varchar', length: 200 })
  @Expose()
  nameCn: string;

  @Column({ name: 'name_en', type: 'varchar', length: 200, nullable: true })
  @Expose()
  nameEn: string;

  @Column({ name: 'country_id', type: 'bigint', nullable: false })
  @Expose()
  countryId: number;

  @Column({ name: 'country_name', type: 'varchar', length: 100 })
  @Expose()
  countryName: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

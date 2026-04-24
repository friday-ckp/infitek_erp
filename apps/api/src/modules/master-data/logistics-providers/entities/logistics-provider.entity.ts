import { Column, DeleteDateColumn, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { LogisticsProviderStatus } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('logistics_providers')
@Unique('idx_logistics_providers_name', ['name'])
@Unique('idx_logistics_providers_code', ['providerCode'])
@Index('idx_logistics_providers_country_id', ['countryId'])
export class LogisticsProvider extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  name: string;

  @Column({ name: 'provider_code', type: 'varchar', length: 20, nullable: false })
  @Expose()
  providerCode: string;

  @Column({ name: 'short_name', type: 'varchar', length: 100, nullable: false })
  @Expose()
  shortName: string;

  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: false })
  @Expose()
  contactPerson: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: false })
  @Expose()
  contactPhone: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 200, nullable: false })
  @Expose()
  contactEmail: string;

  @Column({ name: 'address', type: 'varchar', length: 500, nullable: false })
  @Expose()
  address: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: Object.values(LogisticsProviderStatus),
    default: LogisticsProviderStatus.COOPERATING,
  })
  @Expose()
  status: LogisticsProviderStatus;

  @Column({ name: 'provider_level', type: 'int', nullable: true })
  @Expose()
  providerLevel: number | null;

  @Column({ name: 'country_id', type: 'bigint', nullable: true })
  @Expose()
  countryId: number | null;

  @Column({ name: 'country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  countryName: string | null;

  @Column({ name: 'default_company_id', type: 'bigint', nullable: true })
  @Expose()
  defaultCompanyId: number | null;

  @Column({ name: 'default_company_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  defaultCompanyName: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

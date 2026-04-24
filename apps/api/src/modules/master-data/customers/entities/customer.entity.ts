import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('customers')
@Unique('idx_customers_code', ['customerCode'])
@Index('idx_customers_name', ['customerName'])
@Index('idx_customers_country_id', ['countryId'])
@Index('idx_customers_salesperson_id', ['salespersonId'])
export class Customer extends BaseEntity {
  @Column({ name: 'customer_code', type: 'varchar', length: 50 })
  @Expose()
  customerCode: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 200 })
  @Expose()
  customerName: string;

  @Column({ name: 'country_id', type: 'bigint', nullable: false })
  @Expose()
  countryId: number;

  @Column({ name: 'country_name', type: 'varchar', length: 100, nullable: false })
  @Expose()
  countryName: string;

  @Column({ name: 'salesperson_id', type: 'bigint', nullable: false })
  @Expose()
  salespersonId: number;

  @Column({ name: 'salesperson_name', type: 'varchar', length: 100, nullable: false })
  @Expose()
  salespersonName: string;

  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: true })
  @Expose()
  contactPerson: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  @Expose()
  contactPhone: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 100, nullable: true })
  @Expose()
  contactEmail: string | null;

  @Column({ name: 'billing_requirements', type: 'text', nullable: true })
  @Expose()
  billingRequirements: string | null;

  @Column({ name: 'address', type: 'varchar', length: 500, nullable: true })
  @Expose()
  address: string | null;
}

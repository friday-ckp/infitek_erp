import { Column, Entity, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('companies')
@Unique('idx_companies_name', ['name'])
export class Company extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  name: string;

  @Column({ name: 'signing_location', type: 'varchar', length: 200, nullable: true })
  @Expose()
  signingLocation: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  bankName: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 100, nullable: true })
  @Expose()
  bankAccount: string | null;

  @Column({ name: 'swift_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  swiftCode: string | null;

  @Column({ name: 'default_currency_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  defaultCurrencyCode: string | null;

  @Column({ name: 'tax_id', type: 'varchar', length: 100, nullable: true })
  @Expose()
  taxId: string | null;

  @Column({ name: 'customs_code', type: 'varchar', length: 100, nullable: true })
  @Expose()
  customsCode: string | null;

  @Column({ name: 'quarantine_code', type: 'varchar', length: 100, nullable: true })
  @Expose()
  quarantineCode: string | null;
}

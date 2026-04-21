import { Column, Entity, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('companies')
@Unique('idx_companies_name', ['nameCn'])
export class Company extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  nameCn: string;

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

  @Column({ name: 'name_en', type: 'varchar', length: 200, nullable: true })
  @Expose()
  nameEn: string | null;

  @Column({ name: 'abbreviation', type: 'varchar', length: 50, nullable: true })
  @Expose()
  abbreviation: string | null;

  @Column({ name: 'country_id', type: 'bigint', nullable: true })
  @Expose()
  countryId: number | null;

  @Column({ name: 'country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  countryName: string | null;

  @Column({ name: 'address_cn', type: 'varchar', length: 500, nullable: true })
  @Expose()
  addressCn: string | null;

  @Column({ name: 'address_en', type: 'varchar', length: 500, nullable: true })
  @Expose()
  addressEn: string | null;

  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: true })
  @Expose()
  contactPerson: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  @Expose()
  contactPhone: string | null;

  @Column({ name: 'default_currency_name', type: 'varchar', length: 50, nullable: true })
  @Expose()
  defaultCurrencyName: string | null;

  @Column({ name: 'chief_accountant_id', type: 'bigint', nullable: true })
  @Expose()
  chiefAccountantId: number | null;

  @Column({ name: 'chief_accountant_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  chiefAccountantName: string | null;
}

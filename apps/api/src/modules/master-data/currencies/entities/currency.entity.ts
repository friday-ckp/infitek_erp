import { Column, DeleteDateColumn, Entity, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { CurrencyStatus } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('currencies')
@Unique('idx_currencies_code', ['code'])
export class Currency extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 10 })
  @Expose()
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 50 })
  @Expose()
  name: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: Object.values(CurrencyStatus),
    default: CurrencyStatus.ACTIVE,
  })
  @Expose()
  status: CurrencyStatus;

  @Column({ name: 'symbol', type: 'varchar', length: 10, nullable: true })
  @Expose()
  symbol: string | null;

  @Column({ name: 'is_base_currency', type: 'tinyint', width: 1, default: 0 })
  @Expose()
  isBaseCurrency: number;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

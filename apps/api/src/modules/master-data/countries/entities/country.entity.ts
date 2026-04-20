import { Column, DeleteDateColumn, Entity, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('countries')
@Unique('idx_countries_code', ['code'])
export class Country extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Expose()
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 10 })
  @Expose()
  code: string;

  @Column({ name: 'name_en', type: 'varchar', length: 100, nullable: true })
  @Expose()
  nameEn: string | null;

  @Column({ name: 'abbreviation', type: 'varchar', length: 20, nullable: true })
  @Expose()
  abbreviation: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

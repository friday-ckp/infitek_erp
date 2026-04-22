import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('spu_faqs')
@Index('idx_spu_faqs_spu_id', ['spuId'])
export class SpuFaq extends BaseEntity {
  @Column({ name: 'spu_id', type: 'bigint', unsigned: true })
  @Expose()
  spuId: number;

  @Column({ name: 'question', type: 'varchar', length: 500 })
  @Expose()
  question: string;

  @Column({ name: 'answer', type: 'text' })
  @Expose()
  answer: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @Expose()
  sortOrder: number;
}

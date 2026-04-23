import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { SpuFaqQuestionType } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('spu_faqs')
@Index('idx_spu_faqs_spu_id', ['spuId'])
export class SpuFaq extends BaseEntity {
  @Column({ name: 'spu_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  spuId: number | null;

  @Column({ name: 'spu_code', type: 'varchar', length: 30, nullable: true })
  @Expose()
  spuCode: string | null;

  @Column({ name: 'question', type: 'varchar', length: 500 })
  @Expose()
  question: string;

  @Column({ name: 'answer', type: 'text' })
  @Expose()
  answer: string;

  @Column({
    name: 'question_type',
    type: 'varchar',
    length: 50,
    default: SpuFaqQuestionType.GENERAL_KNOWLEDGE,
  })
  @Expose()
  questionType: SpuFaqQuestionType;

  @Column({ name: 'attachment_url', type: 'varchar', length: 500, nullable: true })
  @Expose()
  attachmentUrl: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @Expose()
  sortOrder: number;
}

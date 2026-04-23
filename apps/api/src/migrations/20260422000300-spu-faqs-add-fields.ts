import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SpuFaqsAddFields20260422000300 implements MigrationInterface {
  name = 'SpuFaqsAddFields20260422000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('spu_faqs', [
      new TableColumn({
        name: 'question_type',
        type: 'varchar',
        length: '50',
        isNullable: false,
        default: "'general_knowledge'",
        comment: '问题类型枚举',
      }),
      new TableColumn({
        name: 'attachment_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
        default: null,
        comment: '附件 OSS key',
      }),
      new TableColumn({
        name: 'spu_code',
        type: 'varchar',
        length: '30',
        isNullable: true,
        default: null,
        comment: 'SPU 编码（冗余，便于查询）',
      }),
    ]);

    // spu_id 改为可空（FAQ 可以不关联 SPU）
    await queryRunner.changeColumn(
      'spu_faqs',
      'spu_id',
      new TableColumn({
        name: 'spu_id',
        type: 'bigint',
        unsigned: true,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'spu_faqs',
      'spu_id',
      new TableColumn({
        name: 'spu_id',
        type: 'bigint',
        unsigned: true,
        isNullable: false,
      }),
    );
    await queryRunner.dropColumn('spu_faqs', 'spu_code');
    await queryRunner.dropColumn('spu_faqs', 'attachment_url');
    await queryRunner.dropColumn('spu_faqs', 'question_type');
  }
}

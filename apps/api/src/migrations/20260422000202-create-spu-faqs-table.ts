import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSpuFaqsTable20260422000202 implements MigrationInterface {
  name = 'CreateSpuFaqsTable20260422000202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'spu_faqs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'spu_id', type: 'bigint', unsigned: true, isNullable: false },
          { name: 'question', type: 'varchar', length: '500', isNullable: false },
          { name: 'answer', type: 'text', isNullable: false },
          { name: 'sort_order', type: 'int', isNullable: false, default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('spu_faqs', [
      new TableIndex({ name: 'idx_spu_faqs_spu_id', columnNames: ['spu_id'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('spu_faqs');
  }
}

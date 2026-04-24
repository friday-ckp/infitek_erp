import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProductDocumentsTable20260424000100 implements MigrationInterface {
  name = 'CreateProductDocumentsTable20260424000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_documents',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'document_name', type: 'varchar', length: '200', isNullable: false },
          { name: 'document_type', type: 'varchar', length: '50', isNullable: false },
          { name: 'content', type: 'longtext', isNullable: true },
          { name: 'attribution_type', type: 'varchar', length: '50', isNullable: false },
          { name: 'country_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'category_level1_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'category_level2_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'category_level3_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'spu_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'file_key', type: 'varchar', length: '500', isNullable: true },
          { name: 'file_name', type: 'varchar', length: '200', isNullable: true },
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

    await queryRunner.createIndices('product_documents', [
      new TableIndex({ name: 'idx_product_documents_type', columnNames: ['document_type'] }),
      new TableIndex({ name: 'idx_product_documents_attribution', columnNames: ['attribution_type'] }),
      new TableIndex({ name: 'idx_product_documents_spu_id', columnNames: ['spu_id'] }),
      new TableIndex({ name: 'idx_product_documents_category_l1', columnNames: ['category_level1_id'] }),
      new TableIndex({ name: 'idx_product_documents_category_l2', columnNames: ['category_level2_id'] }),
      new TableIndex({ name: 'idx_product_documents_category_l3', columnNames: ['category_level3_id'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_documents');
  }
}

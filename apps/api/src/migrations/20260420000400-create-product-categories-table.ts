import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProductCategoriesTable20260420000400 implements MigrationInterface {
  name = 'CreateProductCategoriesTable20260420000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_categories',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'parent_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'level', type: 'tinyint', unsigned: true, isNullable: false },
          { name: 'sort_order', type: 'int', default: '0', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
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

    await queryRunner.createIndices('product_categories', [
      new TableIndex({
        name: 'idx_product_categories_parent_id',
        columnNames: ['parent_id'],
      }),
      new TableIndex({
        name: 'idx_product_categories_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_categories');
  }
}

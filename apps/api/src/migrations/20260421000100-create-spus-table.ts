import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSpusTable20260421000100 implements MigrationInterface {
  name = 'CreateSpusTable20260421000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'spus',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'spu_code', type: 'varchar', length: '30', isNullable: false },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          { name: 'category_id', type: 'bigint', unsigned: true, isNullable: false },
          { name: 'category_level1_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'category_level2_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'unit', type: 'varchar', length: '50', isNullable: true },
          { name: 'manufacturer_model', type: 'varchar', length: '200', isNullable: true },
          { name: 'customer_warranty_months', type: 'int', unsigned: true, isNullable: true },
          { name: 'purchase_warranty_months', type: 'int', unsigned: true, isNullable: true },
          { name: 'supplier_warranty_note', type: 'text', isNullable: true },
          { name: 'forbidden_countries', type: 'varchar', length: '500', isNullable: true },
          { name: 'invoice_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'invoice_unit', type: 'varchar', length: '50', isNullable: true },
          { name: 'invoice_model', type: 'varchar', length: '200', isNullable: true },
          { name: 'supplier_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'company_id', type: 'bigint', unsigned: true, isNullable: true },
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

    await queryRunner.createIndices('spus', [
      new TableIndex({ name: 'uq_spus_spu_code', columnNames: ['spu_code'], isUnique: true }),
      new TableIndex({ name: 'idx_spus_category_id', columnNames: ['category_id'] }),
      new TableIndex({ name: 'idx_spus_name', columnNames: ['name'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('spus');
  }
}

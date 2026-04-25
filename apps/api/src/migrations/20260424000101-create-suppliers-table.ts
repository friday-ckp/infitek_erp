import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSuppliersTable20260424000101 implements MigrationInterface {
  name = 'CreateSuppliersTable20260424000101';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'suppliers',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '200' },
          { name: 'short_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'supplier_code', type: 'varchar', length: '20' },
          { name: 'contact_person', type: 'varchar', length: '100', isNullable: true },
          { name: 'contact_phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'contact_email', type: 'varchar', length: '100', isNullable: true },
          { name: 'address', type: 'varchar', length: '500', isNullable: true },
          { name: 'country_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'country_name', type: 'varchar', length: '100', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['合作', '淘汰', '临拓'],
            default: "'合作'",
          },
          { name: 'supplier_level', type: 'varchar', length: '50', isNullable: true },
          {
            name: 'invoice_type',
            type: 'enum',
            enum: ['普票', '13%专票', '7%专票', '1%专票'],
            isNullable: true,
          },
          { name: 'origin', type: 'varchar', length: '100', isNullable: true },
          {
            name: 'annual_rebate_enabled',
            type: 'tinyint',
            width: 1,
            default: 0,
          },
          { name: 'contract_framework_file', type: 'varchar', length: '500', isNullable: true },
          { name: 'contract_template_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'annual_rebate_note', type: 'text', isNullable: true },
          { name: 'contract_terms', type: 'text', isNullable: true },
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

    await queryRunner.createIndices('suppliers', [
      new TableIndex({
        name: 'uq_suppliers_supplier_code',
        columnNames: ['supplier_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_suppliers_name',
        columnNames: ['name'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'supplier_payment_terms',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'supplier_id', type: 'bigint', unsigned: true },
          { name: 'company_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'company_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'payment_term_name', type: 'varchar', length: '100', isNullable: true },
          {
            name: 'settlement_type',
            type: 'enum',
            enum: ['月结', '发货前结算', '半月结', '票结'],
            isNullable: true,
          },
          { name: 'settlement_days', type: 'int', unsigned: true, isNullable: true },
          { name: 'monthly_settlement_date', type: 'int', unsigned: true, isNullable: true },
          {
            name: 'settlement_date_type',
            type: 'enum',
            enum: ['采购下单日期', '采购入库日期', '采购开票日期'],
            isNullable: true,
          },
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

    await queryRunner.createIndices('supplier_payment_terms', [
      new TableIndex({
        name: 'idx_supplier_payment_terms_supplier_id',
        columnNames: ['supplier_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('supplier_payment_terms');
    await queryRunner.dropTable('suppliers');
  }
}

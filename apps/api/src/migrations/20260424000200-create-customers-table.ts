import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCustomersTable20260424000200 implements MigrationInterface {
  name = 'CreateCustomersTable20260424000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'customer_code', type: 'varchar', length: '50', isNullable: false },
          { name: 'customer_name', type: 'varchar', length: '200', isNullable: false },
          { name: 'country_id', type: 'bigint', unsigned: true, isNullable: false },
          { name: 'country_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'salesperson_id', type: 'bigint', unsigned: true, isNullable: false },
          { name: 'salesperson_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'contact_person', type: 'varchar', length: '100', isNullable: true },
          { name: 'contact_phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'contact_email', type: 'varchar', length: '100', isNullable: true },
          { name: 'billing_requirements', type: 'text', isNullable: true },
          { name: 'address', type: 'varchar', length: '500', isNullable: true },
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

    await queryRunner.createIndices('customers', [
      new TableIndex({
        name: 'idx_customers_code',
        columnNames: ['customer_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_customers_name',
        columnNames: ['customer_name'],
      }),
      new TableIndex({
        name: 'idx_customers_country_id',
        columnNames: ['country_id'],
      }),
      new TableIndex({
        name: 'idx_customers_salesperson_id',
        columnNames: ['salesperson_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('customers');
  }
}

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCompaniesTable20260420000100 implements MigrationInterface {
  name = 'CreateCompaniesTable20260420000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          { name: 'signing_location', type: 'varchar', length: '200', isNullable: true },
          { name: 'bank_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'bank_account', type: 'varchar', length: '100', isNullable: true },
          { name: 'swift_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'default_currency_code', type: 'varchar', length: '20', isNullable: true, comment: '币种代码，软引用 currencies.code' },
          { name: 'tax_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'customs_code', type: 'varchar', length: '100', isNullable: true },
          { name: 'quarantine_code', type: 'varchar', length: '100', isNullable: true },
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

    await queryRunner.createIndices('companies', [
      new TableIndex({
        name: 'idx_companies_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('companies');
  }
}

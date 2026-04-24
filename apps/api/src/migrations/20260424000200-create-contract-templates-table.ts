import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { ContractTemplateStatus } from '@infitek/shared';

export class CreateContractTemplatesTable20260424000200 implements MigrationInterface {
  name = 'CreateContractTemplatesTable20260424000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'contract_templates',
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
          { name: 'template_file_key', type: 'varchar', length: '500', isNullable: true },
          { name: 'template_file_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'content', type: 'longtext', isNullable: false },
          { name: 'is_default', type: 'tinyint', width: 1, default: '0' },
          { name: 'requires_legal_review', type: 'tinyint', width: 1, default: '0' },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: `'${ContractTemplateStatus.PENDING_SUBMIT}'`,
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
        uniques: [{ name: 'uq_contract_templates_name', columnNames: ['name'] }],
      }),
      true,
    );

    await queryRunner.createIndices('contract_templates', [
      new TableIndex({ name: 'idx_contract_templates_status', columnNames: ['status'] }),
      new TableIndex({ name: 'idx_contract_templates_created_at', columnNames: ['created_at'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contract_templates');
  }
}

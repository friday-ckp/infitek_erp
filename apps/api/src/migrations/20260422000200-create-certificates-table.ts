import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCertificatesTable20260422000200 implements MigrationInterface {
  name = 'CreateCertificatesTable20260422000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'certificates',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'certificate_no', type: 'varchar', length: '30', isNullable: false },
          { name: 'certificate_name', type: 'varchar', length: '200', isNullable: false },
          { name: 'certificate_type', type: 'varchar', length: '50', isNullable: false },
          { name: 'directive', type: 'varchar', length: '200', isNullable: true },
          { name: 'issue_date', type: 'date', isNullable: true },
          { name: 'valid_from', type: 'date', isNullable: false },
          { name: 'valid_until', type: 'date', isNullable: false },
          { name: 'issuing_authority', type: 'varchar', length: '200', isNullable: false },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'attribution_type', type: 'varchar', length: '50', isNullable: true },
          { name: 'category_id', type: 'bigint', unsigned: true, isNullable: true },
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

    await queryRunner.createIndices('certificates', [
      new TableIndex({
        name: 'uq_certificates_certificate_no',
        columnNames: ['certificate_no'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_certificates_category_id',
        columnNames: ['category_id'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'certificate_spus',
        columns: [
          { name: 'certificate_id', type: 'bigint', unsigned: true, isNullable: false },
          { name: 'spu_id', type: 'bigint', unsigned: true, isNullable: false },
        ],
        indices: [
          {
            name: 'pk_certificate_spus',
            columnNames: ['certificate_id', 'spu_id'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('certificate_spus', [
      new TableForeignKey({
        name: 'fk_certificate_spus_certificate',
        columnNames: ['certificate_id'],
        referencedTableName: 'certificates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'fk_certificate_spus_spu',
        columnNames: ['spu_id'],
        referencedTableName: 'spus',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('certificate_spus');
    await queryRunner.dropTable('certificates');
  }
}

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddContactFieldsToUsers20260602000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      throw new Error('users table not found');
    }

    const existingColumns = new Set(table.columns.map((column) => column.name));

    if (!existingColumns.has('mobile')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'mobile',
          type: 'varchar',
          length: '32',
          isNullable: true,
        }),
      );
    }

    if (!existingColumns.has('email')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'email',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!existingColumns.has('job_number')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'job_number',
          type: 'varchar',
          length: '64',
          isNullable: true,
        }),
      );
    }

    const existingIndexes = new Set(table.indices.map((index) => index.name));

    if (!existingIndexes.has('idx_users_mobile')) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({ name: 'idx_users_mobile', columnNames: ['mobile'] }),
      );
    }

    if (!existingIndexes.has('idx_users_email')) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({ name: 'idx_users_email', columnNames: ['email'] }),
      );
    }

    if (!existingIndexes.has('idx_users_job_number')) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({ name: 'idx_users_job_number', columnNames: ['job_number'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      return;
    }

    const existingIndexes = new Set(table.indices.map((index) => index.name));
    if (existingIndexes.has('idx_users_job_number')) {
      await queryRunner.dropIndex('users', 'idx_users_job_number');
    }
    if (existingIndexes.has('idx_users_email')) {
      await queryRunner.dropIndex('users', 'idx_users_email');
    }
    if (existingIndexes.has('idx_users_mobile')) {
      await queryRunner.dropIndex('users', 'idx_users_mobile');
    }

    const existingColumns = new Set(table.columns.map((column) => column.name));
    const dropColumns = ['job_number', 'email', 'mobile'].filter((name) => existingColumns.has(name));
    if (dropColumns.length > 0) {
      await queryRunner.dropColumns('users', dropColumns);
    }
  }
}

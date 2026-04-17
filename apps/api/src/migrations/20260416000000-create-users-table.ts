import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class CreateUsersTable20260416000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'username', type: 'varchar', length: '50', isNullable: false },
            { name: 'name', type: 'varchar', length: '100', isNullable: false },
            { name: 'password', type: 'varchar', length: '255', isNullable: false },
            {
              name: 'status',
              type: 'enum',
              enum: ['active', 'inactive'],
              default: "'active'",
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
            { name: 'deleted_at', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'idx_users_username',
          columnNames: ['username'],
          isUnique: true,
        }),
      );

      // 插入初始 admin 账号，密码 Admin@123，bcrypt rounds=12
      try {
        const hashedPassword = await bcrypt.hash('Admin@123', 12);
        await queryRunner.query(
          `INSERT INTO users (username, name, password, status, created_by) VALUES (?, ?, ?, 'active', 'system')`,
          ['admin', '系统管理员', hashedPassword],
        );
      } catch (hashError) {
        console.error('Failed to hash password during migration:', hashError);
        throw new Error(`Migration failed: unable to hash admin password - ${hashError.message}`);
      }
    } catch (error) {
      console.error('Migration up failed:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}

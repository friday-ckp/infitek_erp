import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddDingtalkFieldsToUsers20260529000100
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'dingtalk_union_id',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dingtalk_user_id',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dingtalk_open_id',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dingtalk_nick',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dingtalk_avatar',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
      new TableColumn({
        name: 'dingtalk_bound_at',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_dingtalk_union_id',
        columnNames: ['dingtalk_union_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'idx_users_dingtalk_union_id');
    await queryRunner.dropColumns('users', [
      'dingtalk_bound_at',
      'dingtalk_avatar',
      'dingtalk_nick',
      'dingtalk_open_id',
      'dingtalk_user_id',
      'dingtalk_union_id',
    ]);
  }
}

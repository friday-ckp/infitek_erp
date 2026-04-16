import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init20260415104312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 初始迁移文件（Story 1.1）：占位，验证迁移系统可用
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 无需回滚
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCurrenciesAddFields20260420001100 implements MigrationInterface {
  name = 'AlterCurrenciesAddFields20260420001100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`currencies\`
        ADD COLUMN \`symbol\`           varchar(10) NULL     COMMENT '币种符号（如 $、¥、€）',
        ADD COLUMN \`is_base_currency\` tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否本位币'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`currencies\`
        DROP COLUMN \`is_base_currency\`,
        DROP COLUMN \`symbol\`
    `);
  }
}

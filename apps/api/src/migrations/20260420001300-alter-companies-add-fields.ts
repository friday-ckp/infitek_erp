import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCompaniesAddFields20260420001300 implements MigrationInterface {
  name = 'AlterCompaniesAddFields20260420001300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
        ADD COLUMN \`name_en\`               varchar(200) NULL COMMENT '公司英文名称',
        ADD COLUMN \`abbreviation\`          varchar(50)  NULL COMMENT '公司简称',
        ADD COLUMN \`country_id\`            bigint       NULL COMMENT '国家/地区ID（软引用 countries）',
        ADD COLUMN \`country_name\`          varchar(100) NULL COMMENT '国家/地区名称',
        ADD COLUMN \`address_cn\`            varchar(500) NULL COMMENT '中文地址',
        ADD COLUMN \`address_en\`            varchar(500) NULL COMMENT '英文地址',
        ADD COLUMN \`contact_person\`        varchar(100) NULL COMMENT '联系人',
        ADD COLUMN \`contact_phone\`         varchar(50)  NULL COMMENT '联系电话',
        ADD COLUMN \`default_currency_name\` varchar(50)  NULL COMMENT '默认币种名称（冗余）',
        ADD COLUMN \`chief_accountant_id\`   bigint       NULL COMMENT '总账会计用户ID（软引用 users）',
        ADD COLUMN \`chief_accountant_name\` varchar(100) NULL COMMENT '总账会计姓名'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
        DROP COLUMN \`chief_accountant_name\`,
        DROP COLUMN \`chief_accountant_id\`,
        DROP COLUMN \`default_currency_name\`,
        DROP COLUMN \`contact_phone\`,
        DROP COLUMN \`contact_person\`,
        DROP COLUMN \`address_en\`,
        DROP COLUMN \`address_cn\`,
        DROP COLUMN \`country_name\`,
        DROP COLUMN \`country_id\`,
        DROP COLUMN \`abbreviation\`,
        DROP COLUMN \`name_en\`
    `);
  }
}

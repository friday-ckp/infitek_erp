import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCountriesAddFields20260420001200 implements MigrationInterface {
  name = 'AlterCountriesAddFields20260420001200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`countries\`
        ADD COLUMN \`name_en\`      varchar(100) NULL COMMENT '国家/地区英文名称',
        ADD COLUMN \`abbreviation\` varchar(20)  NULL COMMENT '国家/地区简称'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`countries\`
        DROP COLUMN \`abbreviation\`,
        DROP COLUMN \`name_en\`
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterWarehousesAddFields20260420001000 implements MigrationInterface {
  name = 'AlterWarehousesAddFields20260420001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`warehouses\`
        ADD COLUMN \`warehouse_code\`        varchar(50)                    NULL     COMMENT '仓库编号',
        ADD COLUMN \`warehouse_type\`        enum('自营仓','港口仓','工厂仓') NULL     COMMENT '仓库类型',
        ADD COLUMN \`supplier_id\`           bigint                         NULL     COMMENT '关联采购供应商ID（软引用）',
        ADD COLUMN \`supplier_name\`         varchar(200)                   NULL     COMMENT '关联采购供应商名称',
        ADD COLUMN \`default_ship_province\` varchar(50)                    NULL     COMMENT '默认发运省份',
        ADD COLUMN \`default_ship_city\`     varchar(50)                    NULL     COMMENT '默认发运城市',
        ADD COLUMN \`ownership\`             enum('内部仓','外部仓') NOT NULL DEFAULT '内部仓' COMMENT '仓库归属',
        ADD COLUMN \`is_virtual\`            tinyint(1)             NOT NULL DEFAULT 0 COMMENT '是否虚拟仓'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`warehouses\`
        DROP COLUMN \`is_virtual\`,
        DROP COLUMN \`ownership\`,
        DROP COLUMN \`default_ship_city\`,
        DROP COLUMN \`default_ship_province\`,
        DROP COLUMN \`supplier_name\`,
        DROP COLUMN \`supplier_id\`,
        DROP COLUMN \`warehouse_type\`,
        DROP COLUMN \`warehouse_code\`
    `);
  }
}

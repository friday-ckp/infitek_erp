import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SkuAddFields20260423000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('skus', [
      new TableColumn({ name: 'product_model', type: 'varchar', length: '200', isNullable: true }),
      new TableColumn({ name: 'accessory_parent_sku_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'category_level1_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'category_level2_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'category_level3_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'packaging_list', type: 'text', isNullable: true }),
      new TableColumn({ name: 'product_image_urls', type: 'text', isNullable: true }),
    ]);
    await queryRunner.changeColumn('skus', 'status', new TableColumn({
      name: 'status', type: 'varchar', length: '20', isNullable: false, default: "'上架'",
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn('skus', 'status', new TableColumn({
      name: 'status', type: 'varchar', length: '20', isNullable: false, default: "'active'",
    }));
    await queryRunner.dropColumn('skus', 'product_image_urls');
    await queryRunner.dropColumn('skus', 'packaging_list');
    await queryRunner.dropColumn('skus', 'category_level3_id');
    await queryRunner.dropColumn('skus', 'category_level2_id');
    await queryRunner.dropColumn('skus', 'category_level1_id');
    await queryRunner.dropColumn('skus', 'accessory_parent_sku_id');
    await queryRunner.dropColumn('skus', 'product_model');
  }
}

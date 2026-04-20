import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFieldsToProductCategories20260420000401 implements MigrationInterface {
  name = 'AddFieldsToProductCategories20260420000401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product_categories', [
      new TableColumn({ name: 'name_en', type: 'varchar', length: '100', isNullable: true, after: 'name' }),
      new TableColumn({ name: 'code', type: 'varchar', length: '20', isNullable: true, after: 'name_en' }),
      new TableColumn({ name: 'purchase_owner', type: 'varchar', length: '100', isNullable: true, after: 'sort_order' }),
      new TableColumn({ name: 'product_owner', type: 'varchar', length: '100', isNullable: true, after: 'purchase_owner' }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_categories', 'product_owner');
    await queryRunner.dropColumn('product_categories', 'purchase_owner');
    await queryRunner.dropColumn('product_categories', 'code');
    await queryRunner.dropColumn('product_categories', 'name_en');
  }
}

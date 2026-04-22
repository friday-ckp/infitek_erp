import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SpuAddCategoryCodes20260422000100 implements MigrationInterface {
  name = 'SpuAddCategoryCodes20260422000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('spus', [
      new TableColumn({
        name: 'category_level1_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: null,
        comment: '一级分类编号（冗余）',
      }),
      new TableColumn({
        name: 'category_level2_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: null,
        comment: '二级分类编号（冗余）',
      }),
      new TableColumn({
        name: 'category_level3_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: null,
        comment: '三级分类编号（冗余，即选中分类的 code）',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('spus', 'category_level3_code');
    await queryRunner.dropColumn('spus', 'category_level2_code');
    await queryRunner.dropColumn('spus', 'category_level1_code');
  }
}

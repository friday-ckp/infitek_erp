import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVoidFieldsToShippingDemands20260429000100 implements MigrationInterface {
  name = 'AddVoidFieldsToShippingDemands20260429000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('shipping_demands', [
      new TableColumn({
        name: 'voided_at',
        type: 'datetime',
        isNullable: true,
      }),
      new TableColumn({
        name: 'voided_by',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('shipping_demands', 'voided_by');
    await queryRunner.dropColumn('shipping_demands', 'voided_at');
  }
}

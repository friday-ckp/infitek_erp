import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddBatchNoToInventoryBatch20260427000200
  implements MigrationInterface
{
  name = 'AddBatchNoToInventoryBatch20260427000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory_batch');
    if (!table?.findColumnByName('batch_no')) {
      await queryRunner.addColumn(
        'inventory_batch',
        new TableColumn({
          name: 'batch_no',
          type: 'varchar',
          length: '60',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE inventory_batch
      SET batch_no = CONCAT(
        CASE
          WHEN source_type = 'initial' THEN 'INV-INIT'
          WHEN source_type = 'purchase_receipt' THEN 'INV-REC'
          ELSE 'INV-BAT'
        END,
        '-',
        DATE_FORMAT(receipt_date, '%Y%m%d'),
        '-',
        LPAD(id, 6, '0')
      )
      WHERE batch_no IS NULL OR batch_no = ''
    `);

    await queryRunner.changeColumn(
      'inventory_batch',
      'batch_no',
      new TableColumn({
        name: 'batch_no',
        type: 'varchar',
        length: '60',
        isNullable: false,
      }),
    );

    const refreshedTable = await queryRunner.getTable('inventory_batch');
    if (!refreshedTable?.indices.some((index) => index.name === 'uq_inventory_batch_no')) {
      await queryRunner.createIndex(
        'inventory_batch',
        new TableIndex({
          name: 'uq_inventory_batch_no',
          columnNames: ['batch_no'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory_batch');
    if (table?.indices.some((index) => index.name === 'uq_inventory_batch_no')) {
      await queryRunner.dropIndex('inventory_batch', 'uq_inventory_batch_no');
    }
    if (table?.findColumnByName('batch_no')) {
      await queryRunner.dropColumn('inventory_batch', 'batch_no');
    }
  }
}

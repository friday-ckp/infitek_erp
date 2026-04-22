import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSkusTable20260422000200 implements MigrationInterface {
  name = 'CreateSkusTable20260422000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'skus',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'sku_code', type: 'varchar', length: '30', isNullable: false },
          { name: 'spu_id', type: 'bigint', unsigned: true, isNullable: false },
          { name: 'unit_id', type: 'bigint', unsigned: true, isNullable: true },
          // --- 产品基本 ---
          { name: 'name_cn', type: 'varchar', length: '200', isNullable: true },
          { name: 'name_en', type: 'varchar', length: '200', isNullable: true },
          { name: 'specification', type: 'varchar', length: '500', isNullable: false },
          { name: 'status', type: 'varchar', length: '20', isNullable: false, default: "'active'" },
          { name: 'product_type', type: 'varchar', length: '100', isNullable: true },
          { name: 'principle', type: 'varchar', length: '200', isNullable: true },
          { name: 'product_usage', type: 'text', isNullable: true },
          { name: 'core_params', type: 'text', isNullable: true },
          { name: 'electrical_params', type: 'text', isNullable: true },
          { name: 'material', type: 'varchar', length: '200', isNullable: true },
          { name: 'has_plug', type: 'tinyint', width: 1, isNullable: true },
          { name: 'special_attributes', type: 'varchar', length: '500', isNullable: true },
          { name: 'special_attributes_note', type: 'text', isNullable: true },
          { name: 'customer_warranty_months', type: 'int', unsigned: true, isNullable: true },
          { name: 'forbidden_countries', type: 'varchar', length: '500', isNullable: true },
          // --- 重量体积 ---
          { name: 'weight_kg', type: 'decimal', precision: 10, scale: 3, isNullable: false },
          { name: 'gross_weight_kg', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'length_cm', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'width_cm', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'height_cm', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'volume_cbm', type: 'decimal', precision: 10, scale: 4, isNullable: false },
          // --- 包装 ---
          { name: 'packaging_type', type: 'varchar', length: '100', isNullable: true },
          { name: 'packaging_qty', type: 'int', unsigned: true, isNullable: true },
          { name: 'packaging_info', type: 'text', isNullable: true },
          // --- 报关 ---
          { name: 'hs_code', type: 'varchar', length: '20', isNullable: false },
          { name: 'customs_name_cn', type: 'varchar', length: '200', isNullable: false },
          { name: 'customs_name_en', type: 'varchar', length: '200', isNullable: false },
          { name: 'declared_value_ref', type: 'decimal', precision: 12, scale: 2, isNullable: true },
          { name: 'declaration_elements', type: 'text', isNullable: true },
          { name: 'is_inspection_required', type: 'tinyint', width: 1, isNullable: true },
          { name: 'regulatory_conditions', type: 'varchar', length: '500', isNullable: true },
          { name: 'tax_refund_rate', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'customs_info_maintained', type: 'tinyint', width: 1, isNullable: true },
          // --- 图片 ---
          { name: 'product_image_url', type: 'varchar', length: '500', isNullable: true },
          // --- 审计字段 ---
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('skus', [
      new TableIndex({ name: 'uq_skus_sku_code', columnNames: ['sku_code'], isUnique: true }),
      new TableIndex({ name: 'idx_skus_spu_id', columnNames: ['spu_id'] }),
      new TableIndex({ name: 'idx_skus_hs_code', columnNames: ['hs_code'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('skus');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyColumns1712870300000 implements MigrationInterface {
  name = 'RemoveLegacyColumns1712870300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP INDEX uq_users_legacy_user_id,
      DROP COLUMN legacy_user_id,
      DROP COLUMN legacy_role_name
    `);

    await queryRunner.query(`
      ALTER TABLE product_categories
      DROP INDEX uq_product_categories_legacy_id,
      DROP COLUMN legacy_product_type_id
    `);

    await queryRunner.query(`
      ALTER TABLE sales
      DROP INDEX uq_sales_legacy_sale_id,
      DROP COLUMN legacy_sale_id,
      DROP COLUMN legacy_fecha_string
    `);

    await queryRunner.query(`
      ALTER TABLE sale_items
      DROP INDEX uq_sale_items_legacy_cash_sale_id,
      DROP COLUMN legacy_cash_sale_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sale_items
      ADD COLUMN legacy_cash_sale_id VARCHAR(191) NULL,
      ADD UNIQUE INDEX uq_sale_items_legacy_cash_sale_id (legacy_cash_sale_id)
    `);

    await queryRunner.query(`
      ALTER TABLE sales
      ADD COLUMN legacy_sale_id VARCHAR(191) NULL AFTER id,
      ADD COLUMN legacy_fecha_string VARCHAR(100) NULL AFTER occurred_at,
      ADD UNIQUE INDEX uq_sales_legacy_sale_id (legacy_sale_id)
    `);

    await queryRunner.query(`
      ALTER TABLE product_categories
      ADD COLUMN legacy_product_type_id VARCHAR(191) NULL AFTER id,
      ADD UNIQUE INDEX uq_product_categories_legacy_id (legacy_product_type_id)
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN legacy_user_id VARCHAR(191) NULL AFTER id,
      ADD COLUMN legacy_role_name VARCHAR(100) NULL AFTER role_id,
      ADD UNIQUE INDEX uq_users_legacy_user_id (legacy_user_id)
    `);
  }
}

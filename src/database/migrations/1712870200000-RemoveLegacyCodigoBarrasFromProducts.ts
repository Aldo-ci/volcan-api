import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyCodigoBarrasFromProducts1712870200000
  implements MigrationInterface
{
  name = 'RemoveLegacyCodigoBarrasFromProducts1712870200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP INDEX uq_products_legacy_codigo_barras
    `);

    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN legacy_codigo_barras
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN legacy_codigo_barras VARCHAR(191) NULL
    `);

    await queryRunner.query(`
      UPDATE products
      SET legacy_codigo_barras = id
      WHERE legacy_codigo_barras IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE products
      MODIFY COLUMN legacy_codigo_barras VARCHAR(191) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE products
      ADD UNIQUE INDEX uq_products_legacy_codigo_barras (legacy_codigo_barras)
    `);
  }
}

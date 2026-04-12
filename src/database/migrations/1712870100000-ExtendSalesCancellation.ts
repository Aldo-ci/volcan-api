import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendSalesCancellation1712870100000 implements MigrationInterface {
  name = 'ExtendSalesCancellation1712870100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sales
      ADD COLUMN status ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed' AFTER notes,
      ADD COLUMN cancelled_at DATETIME NULL AFTER status,
      ADD COLUMN cancelled_by_user_id CHAR(36) NULL AFTER cancelled_at,
      ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER cancelled_by_user_id
    `);

    await queryRunner.query(`
      ALTER TABLE sales
      ADD KEY idx_sales_cancelled_by_user_id (cancelled_by_user_id),
      ADD CONSTRAINT fk_sales_cancelled_by_user
        FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sales
      DROP FOREIGN KEY fk_sales_cancelled_by_user
    `);
    await queryRunner.query(`
      ALTER TABLE sales
      DROP INDEX idx_sales_cancelled_by_user_id,
      DROP COLUMN cancellation_reason,
      DROP COLUMN cancelled_by_user_id,
      DROP COLUMN cancelled_at,
      DROP COLUMN status
    `);
  }
}

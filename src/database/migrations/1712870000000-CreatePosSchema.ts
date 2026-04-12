import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePosSchema1712870000000 implements MigrationInterface {
  name = 'CreatePosSchema1712870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE roles (
          id CHAR(36) NOT NULL,
          code VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_roles_code (code),
          UNIQUE KEY uq_roles_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE users (
          id CHAR(36) NOT NULL,
          legacy_user_id VARCHAR(191) NULL,
          username VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role_id CHAR(36) NULL,
          legacy_role_name VARCHAR(100) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_users_username (username),
          UNIQUE KEY uq_users_legacy_user_id (legacy_user_id),
          KEY idx_users_role_id (role_id),
          CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
              ON UPDATE CASCADE
              ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE product_categories (
          id CHAR(36) NOT NULL,
          legacy_product_type_id VARCHAR(191) NULL,
          name VARCHAR(120) NOT NULL,
          description VARCHAR(255) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_product_categories_name (name),
          UNIQUE KEY uq_product_categories_legacy_id (legacy_product_type_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE products (
          id CHAR(36) NOT NULL,
          legacy_codigo_barras VARCHAR(191) NOT NULL,
          barcode VARCHAR(100) NULL,
          name VARCHAR(150) NOT NULL,
          description VARCHAR(255) NULL,
          image_url VARCHAR(500) NOT NULL DEFAULT '',
          category_id CHAR(36) NOT NULL,
          regular_price DECIMAL(12,2) NOT NULL,
          sale_price DECIMAL(12,2) NULL,
          stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
          minimum_stock INT UNSIGNED NOT NULL DEFAULT 0,
          color VARCHAR(50) NULL,
          size VARCHAR(50) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_products_legacy_codigo_barras (legacy_codigo_barras),
          UNIQUE KEY uq_products_barcode (barcode),
          KEY idx_products_category_id (category_id),
          KEY idx_products_name (name),
          KEY idx_products_is_active (is_active),
          CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories(id)
              ON UPDATE CASCADE
              ON DELETE RESTRICT,
          CONSTRAINT chk_products_regular_price_non_negative CHECK (regular_price >= 0),
          CONSTRAINT chk_products_sale_price_non_negative CHECK (sale_price IS NULL OR sale_price >= 0),
          CONSTRAINT chk_products_sale_price_lte_regular CHECK (sale_price IS NULL OR sale_price <= regular_price)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE sales (
          id CHAR(36) NOT NULL,
          legacy_sale_id VARCHAR(191) NULL,
          occurred_at DATETIME NOT NULL,
          legacy_fecha_string VARCHAR(100) NULL,
          created_by_user_id CHAR(36) NULL,
          subtotal DECIMAL(12,2) NULL,
          discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          total DECIMAL(12,2) NOT NULL,
          has_discount TINYINT(1) NOT NULL DEFAULT 0,
          notes VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_sales_legacy_sale_id (legacy_sale_id),
          KEY idx_sales_occurred_at (occurred_at),
          KEY idx_sales_created_by_user_id (created_by_user_id),
          CONSTRAINT fk_sales_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
              ON UPDATE CASCADE
              ON DELETE SET NULL,
          CONSTRAINT chk_sales_discount_total_non_negative CHECK (discount_total >= 0),
          CONSTRAINT chk_sales_total_non_negative CHECK (total >= 0),
          CONSTRAINT chk_sales_subtotal_non_negative CHECK (subtotal IS NULL OR subtotal >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE sale_items (
          id CHAR(36) NOT NULL,
          legacy_cash_sale_id VARCHAR(191) NULL,
          sale_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          quantity INT UNSIGNED NOT NULL,
          product_name_snapshot VARCHAR(150) NULL,
          product_barcode_snapshot VARCHAR(100) NULL,
          unit_price DECIMAL(12,2) NULL,
          discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          line_total DECIMAL(12,2) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_sale_items_legacy_cash_sale_id (legacy_cash_sale_id),
          KEY idx_sale_items_sale_id (sale_id),
          KEY idx_sale_items_product_id (product_id),
          KEY idx_sale_items_sale_product (sale_id, product_id),
          CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
              ON UPDATE CASCADE
              ON DELETE CASCADE,
          CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id)
              ON UPDATE CASCADE
              ON DELETE RESTRICT,
          CONSTRAINT chk_sale_items_quantity_positive CHECK (quantity > 0),
          CONSTRAINT chk_sale_items_unit_price_non_negative CHECK (unit_price IS NULL OR unit_price >= 0),
          CONSTRAINT chk_sale_items_discount_amount_non_negative CHECK (discount_amount >= 0),
          CONSTRAINT chk_sale_items_line_total_non_negative CHECK (line_total IS NULL OR line_total >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS sale_items');
    await queryRunner.query('DROP TABLE IF EXISTS sales');
    await queryRunner.query('DROP TABLE IF EXISTS products');
    await queryRunner.query('DROP TABLE IF EXISTS product_categories');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TABLE IF EXISTS roles');
  }
}

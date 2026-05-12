import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import dataSource from '../src/database/data-source';
import { ProductCategory } from '../src/product-categories/product-category.entity';
import { Product } from '../src/products/product.entity';
import { Role } from '../src/roles/role.entity';
import { SaleItem } from '../src/sales/sale-item.entity';
import { Sale, SaleStatus } from '../src/sales/sale.entity';
import { User } from '../src/users/user.entity';

const DEFAULT_DUMP_DIR =
  '/Users/aldocitalan/Downloads/dumps/Dump20260507';

type LegacyProductType = {
  id: string;
  nombre: string;
};

type LegacyProduct = {
  codigo_barras: string;
  nombre: string;
  precio: number;
  precio_venta: number;
  cantidad: number;
  color: string | null;
  tamano: string | null;
  stock_minimo: number;
  tipoProductoId: string;
  image_url: string;
  createdAt: string;
  active: number;
};

type LegacySale = {
  id: string;
  fecha: string;
  total: number;
  fecha_string: string;
  has_discount: number;
};

type LegacyCashSale = {
  id: string;
  id_venta: string;
  id_producto: string;
  cantidad: number;
};

type LegacyUser = {
  id: string;
  username: string;
  role: string;
  password: string;
};

type InsertValue = string | number | null;

type Anomaly = {
  type: string;
  message: string;
};

function parseInsertRows(sql: string, tableName: string): InsertValue[][] {
  const marker = `INSERT INTO \`${tableName}\` VALUES `;
  const rows: InsertValue[][] = [];
  let searchIndex = 0;

  while (true) {
    const insertIndex = sql.indexOf(marker, searchIndex);
    if (insertIndex === -1) {
      break;
    }

    let index = insertIndex + marker.length;
    let currentRow: InsertValue[] = [];
    let currentValue = '';
    let currentValueWasString = false;
    let inString = false;
    let rowStarted = false;

    while (index < sql.length) {
      const char = sql[index];
      const nextChar = sql[index + 1];

      if (inString) {
        if (char === '\\') {
          currentValue += nextChar ?? '';
          index += 2;
          continue;
        }

        if (char === "'") {
          if (nextChar === "'") {
            currentValue += "'";
            index += 2;
            continue;
          }

          inString = false;
          index += 1;
          continue;
        }

        currentValue += char;
        index += 1;
        continue;
      }

      if (char === "'") {
        inString = true;
        currentValueWasString = true;
        index += 1;
        continue;
      }

      if (char === '(') {
        rowStarted = true;
        currentRow = [];
        currentValue = '';
        currentValueWasString = false;
        index += 1;
        continue;
      }

      if (rowStarted && char === ',') {
        currentRow.push(parseSqlValue(currentValue, currentValueWasString));
        currentValue = '';
        currentValueWasString = false;
        index += 1;
        continue;
      }

      if (rowStarted && char === ')') {
        currentRow.push(parseSqlValue(currentValue, currentValueWasString));
        rows.push(currentRow);
        rowStarted = false;
        currentValue = '';
        currentValueWasString = false;
        index += 1;
        continue;
      }

      if (!rowStarted && char === ';') {
        searchIndex = index + 1;
        break;
      }

      if (rowStarted) {
        currentValue += char;
      }

      index += 1;
    }
  }

  return rows;
}

function parseSqlValue(value: string, wasString: boolean): InsertValue {
  const trimmed = value.trim();

  if (wasString) {
    return value;
  }

  if (trimmed.toUpperCase() === 'NULL') {
    return null;
  }

  if (trimmed === '') {
    return '';
  }

  const numberValue = Number(trimmed);
  if (!Number.isNaN(numberValue)) {
    return numberValue;
  }

  return trimmed;
}

function requiredString(value: InsertValue, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${field} to be a string`);
  }

  return value;
}

function requiredNumber(value: InsertValue, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Expected ${field} to be a number`);
  }

  return value;
}

function nullableString(value: InsertValue): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function decimal(value: number): string {
  return value.toFixed(2);
}

function roleName(roleCode: string): string {
  if (roleCode === 'admin') {
    return 'Administrator';
  }

  if (roleCode === 'user') {
    return 'User';
  }

  return roleCode
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function truncate(
  value: string,
  maxLength: number,
  anomalies: Anomaly[],
  label: string,
): string {
  if (value.length <= maxLength) {
    return value;
  }

  anomalies.push({
    type: 'truncated-field',
    message: `${label} exceeded ${maxLength} characters and was truncated`,
  });

  return value.slice(0, maxLength);
}

function loadDumpFile(dumpDir: string, fileName: string): string {
  const filePath = join(dumpDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Missing dump file: ${filePath}`);
  }

  return readFileSync(filePath, 'utf8');
}

function loadLegacyData(dumpDir: string) {
  const productTypes = parseInsertRows(
    loadDumpFile(dumpDir, 'ventas_volcan_producttype.sql'),
    'producttype',
  ).map(
    (row): LegacyProductType => ({
      id: requiredString(row[0], 'producttype.id'),
      nombre: requiredString(row[1], 'producttype.nombre'),
    }),
  );

  const products = parseInsertRows(
    loadDumpFile(dumpDir, 'ventas_volcan_product.sql'),
    'product',
  ).map(
    (row): LegacyProduct => ({
      codigo_barras: requiredString(row[0], 'product.codigo_barras'),
      nombre: requiredString(row[1], 'product.nombre'),
      precio: requiredNumber(row[2], 'product.precio'),
      precio_venta: requiredNumber(row[3], 'product.precio_venta'),
      cantidad: requiredNumber(row[4], 'product.cantidad'),
      color: nullableString(row[5]),
      tamano: nullableString(row[6]),
      stock_minimo: requiredNumber(row[7], 'product.stock_minimo'),
      tipoProductoId: requiredString(row[8], 'product.tipoProductoId'),
      image_url: requiredString(row[9], 'product.image_url'),
      createdAt: requiredString(row[10], 'product.createdAt'),
      active: requiredNumber(row[11], 'product.active'),
    }),
  );

  const sales = parseInsertRows(
    loadDumpFile(dumpDir, 'ventas_volcan_sale.sql'),
    'sale',
  ).map(
    (row): LegacySale => ({
      id: requiredString(row[0], 'sale.id'),
      fecha: requiredString(row[1], 'sale.fecha'),
      total: requiredNumber(row[2], 'sale.total'),
      fecha_string: requiredString(row[3], 'sale.fecha_string'),
      has_discount: requiredNumber(row[4], 'sale.has_discount'),
    }),
  );

  const cashSales = parseInsertRows(
    loadDumpFile(dumpDir, 'ventas_volcan_cashsale.sql'),
    'cashsale',
  ).map(
    (row): LegacyCashSale => ({
      id: requiredString(row[0], 'cashsale.id'),
      id_venta: requiredString(row[1], 'cashsale.id_venta'),
      id_producto: requiredString(row[2], 'cashsale.id_producto'),
      cantidad: requiredNumber(row[3], 'cashsale.cantidad'),
    }),
  );

  const users = parseInsertRows(
    loadDumpFile(dumpDir, 'ventas_volcan_user.sql'),
    'user',
  ).map(
    (row): LegacyUser => ({
      id: requiredString(row[0], 'user.id'),
      username: requiredString(row[1], 'user.username'),
      role: requiredString(row[2], 'user.role'),
      password: requiredString(row[3], 'user.password'),
    }),
  );

  return { productTypes, products, sales, cashSales, users };
}

async function ensureDestinationIsEmpty(): Promise<void> {
  const checks = [
    ['roles', Role],
    ['users', User],
    ['product_categories', ProductCategory],
    ['products', Product],
    ['sales', Sale],
    ['sale_items', SaleItem],
  ] as const;

  const nonEmptyTables: string[] = [];

  for (const [tableName, entity] of checks) {
    const count = await dataSource.getRepository(entity).count({
      withDeleted: true,
    });

    if (count > 0) {
      nonEmptyTables.push(`${tableName} (${count})`);
    }
  }

  if (nonEmptyTables.length > 0) {
    throw new Error(
      `Destination database is not empty. Refusing to migrate: ${nonEmptyTables.join(
        ', ',
      )}`,
    );
  }
}

async function migrate(): Promise<void> {
  const dumpDir = process.env.LEGACY_DUMP_DIR ?? DEFAULT_DUMP_DIR;
  const legacy = loadLegacyData(dumpDir);
  const anomalies: Anomaly[] = [];

  validateLegacyRelations(legacy);

  await dataSource.initialize();

  try {
    await ensureDestinationIsEmpty();

    await dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role);
      const userRepository = manager.getRepository(User);
      const categoryRepository = manager.getRepository(ProductCategory);
      const productRepository = manager.getRepository(Product);
      const saleRepository = manager.getRepository(Sale);
      const saleItemRepository = manager.getRepository(SaleItem);

      const roleByCode = new Map<string, Role>();
      const productByBarcode = new Map<string, Product>();

      const roleCodes = Array.from(
        new Set(legacy.users.map((user) => user.role)),
      );

      for (const code of roleCodes) {
        const role = roleRepository.create({
          id: randomUUID(),
          code,
          name: roleName(code),
        });
        roleByCode.set(code, await roleRepository.save(role));
      }

      for (const legacyUser of legacy.users) {
        const role = roleByCode.get(legacyUser.role);
        if (!role) {
          throw new Error(`Missing role for user ${legacyUser.username}`);
        }

        await userRepository.save(
          userRepository.create({
            id: legacyUser.id,
            username: truncate(
              legacyUser.username,
              100,
              anomalies,
              `user.username ${legacyUser.id}`,
            ),
            passwordHash: await bcrypt.hash(legacyUser.password, 10),
            roleId: role.id,
            isActive: true,
          }),
        );
      }

      for (const legacyCategory of legacy.productTypes) {
        await categoryRepository.save(
          categoryRepository.create({
            id: legacyCategory.id,
            name: truncate(
              legacyCategory.nombre.trim(),
              120,
              anomalies,
              `producttype.nombre ${legacyCategory.id}`,
            ),
            isActive: true,
          }),
        );
      }

      for (const legacyProduct of legacy.products) {
        if (legacyProduct.codigo_barras.length > 100) {
          throw new Error(
            `Product barcode exceeds 100 characters: ${legacyProduct.codigo_barras}`,
          );
        }

        const regularPrice = legacyProduct.precio;
        let salePrice = legacyProduct.precio_venta;

        if (salePrice > regularPrice) {
          anomalies.push({
            type: 'invalid-sale-price',
            message: `${legacyProduct.codigo_barras}: precio_venta ${salePrice} > precio ${regularPrice}; salePrice set to ${regularPrice}`,
          });
          salePrice = regularPrice;
        }

        const product = await productRepository.save(
          productRepository.create({
            id: randomUUID(),
            barcode: legacyProduct.codigo_barras,
            name: truncate(
              legacyProduct.nombre,
              150,
              anomalies,
              `product.nombre ${legacyProduct.codigo_barras}`,
            ),
            description: null,
            imageUrl: truncate(
              legacyProduct.image_url || '',
              500,
              anomalies,
              `product.image_url ${legacyProduct.codigo_barras}`,
            ),
            categoryId: legacyProduct.tipoProductoId,
            regularPrice: decimal(regularPrice),
            salePrice: decimal(salePrice),
            stockQuantity: Math.max(0, Math.trunc(legacyProduct.cantidad)),
            minimumStock: Math.max(
              0,
              Math.trunc(legacyProduct.stock_minimo),
            ),
            color: legacyProduct.color
              ? truncate(
                  legacyProduct.color,
                  50,
                  anomalies,
                  `product.color ${legacyProduct.codigo_barras}`,
                )
              : null,
            size: legacyProduct.tamano
              ? truncate(
                  legacyProduct.tamano,
                  50,
                  anomalies,
                  `product.tamano ${legacyProduct.codigo_barras}`,
                )
              : null,
            isActive: legacyProduct.active === 1,
            createdAt: new Date(legacyProduct.createdAt),
          }),
        );

        productByBarcode.set(legacyProduct.codigo_barras, product);
      }

      for (const legacySale of legacy.sales) {
        await saleRepository.save(
          saleRepository.create({
            id: legacySale.id,
            occurredAt: new Date(legacySale.fecha),
            createdByUserId: null,
            subtotal: decimal(legacySale.total),
            discountTotal: '0.00',
            total: decimal(legacySale.total),
            hasDiscount: legacySale.has_discount === 1,
            notes: null,
            status: SaleStatus.COMPLETED,
          }),
        );
      }

      for (const legacyCashSale of legacy.cashSales) {
        const product = productByBarcode.get(legacyCashSale.id_producto);
        if (!product) {
          throw new Error(
            `Missing product for cashsale ${legacyCashSale.id}: ${legacyCashSale.id_producto}`,
          );
        }

        const unitPrice = Number(product.salePrice ?? product.regularPrice);
        const lineTotal = unitPrice * legacyCashSale.cantidad;

        await saleItemRepository.save(
          saleItemRepository.create({
            id: legacyCashSale.id,
            saleId: legacyCashSale.id_venta,
            productId: product.id,
            quantity: Math.trunc(legacyCashSale.cantidad),
            productNameSnapshot: product.name,
            productBarcodeSnapshot: product.barcode,
            unitPrice: decimal(unitPrice),
            discountAmount: '0.00',
            lineTotal: decimal(lineTotal),
          }),
        );
      }
    });

    printReport(legacy, anomalies, dumpDir);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

function validateLegacyRelations(legacy: ReturnType<typeof loadLegacyData>) {
  const categoryIds = new Set(legacy.productTypes.map((category) => category.id));
  const productBarcodes = new Set(
    legacy.products.map((product) => product.codigo_barras),
  );
  const saleIds = new Set(legacy.sales.map((sale) => sale.id));

  const missingProductCategories = legacy.products.filter(
    (product) => !categoryIds.has(product.tipoProductoId),
  );
  if (missingProductCategories.length > 0) {
    throw new Error(
      `Products reference missing product types: ${missingProductCategories
        .map((product) => product.codigo_barras)
        .join(', ')}`,
    );
  }

  const missingCashSaleProducts = legacy.cashSales.filter(
    (cashSale) => !productBarcodes.has(cashSale.id_producto),
  );
  if (missingCashSaleProducts.length > 0) {
    throw new Error(
      `Cash sales reference missing products: ${missingCashSaleProducts
        .map((cashSale) => `${cashSale.id}:${cashSale.id_producto}`)
        .join(', ')}`,
    );
  }

  const missingCashSaleSales = legacy.cashSales.filter(
    (cashSale) => !saleIds.has(cashSale.id_venta),
  );
  if (missingCashSaleSales.length > 0) {
    throw new Error(
      `Cash sales reference missing sales: ${missingCashSaleSales
        .map((cashSale) => `${cashSale.id}:${cashSale.id_venta}`)
        .join(', ')}`,
    );
  }
}

function printReport(
  legacy: ReturnType<typeof loadLegacyData>,
  anomalies: Anomaly[],
  dumpDir: string,
): void {
  console.log('Legacy migration completed.');
  console.log(`Dump directory: ${dumpDir}`);
  console.log(`Roles inserted: ${new Set(legacy.users.map((u) => u.role)).size}`);
  console.log(`Users inserted: ${legacy.users.length}`);
  console.log(`Categories inserted: ${legacy.productTypes.length}`);
  console.log(`Products inserted: ${legacy.products.length}`);
  console.log(`Sales inserted: ${legacy.sales.length}`);
  console.log(`Sale items inserted: ${legacy.cashSales.length}`);

  if (anomalies.length > 0) {
    console.log(`Anomalies: ${anomalies.length}`);
    for (const anomaly of anomalies) {
      console.log(`- [${anomaly.type}] ${anomaly.message}`);
    }
  }
}

migrate().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Legacy migration failed: ${message}`);
  process.exitCode = 1;
});

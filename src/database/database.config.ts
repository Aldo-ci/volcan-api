import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';
import { ProductCategory } from '../product-categories/product-category.entity';
import { Product } from '../products/product.entity';
import { Sale, SaleStatus } from '../sales/sale.entity';
import { SaleItem } from '../sales/sale-item.entity';

export const entities = [Role, User, ProductCategory, Product, Sale, SaleItem];

export function buildTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const dbType = configService.get<string>('DB_TYPE', 'mysql');

  if (dbType === 'sqljs') {
    return {
      type: 'sqljs',
      autoSave: false,
      synchronize: true,
      dropSchema: true,
      autoLoadEntities: true,
      entities,
    };
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', '127.0.0.1'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_NAME', 'volcan_pos'),
    synchronize: false,
    autoLoadEntities: true,
    entities,
    migrationsRun: false,
    logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
  };
}

export { SaleStatus };

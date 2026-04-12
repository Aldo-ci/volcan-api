import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { entities } from './database.config';
const isTsRuntime = __filename.endsWith('.ts');

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'volcan_pos',
  entities,
  migrations: [
    isTsRuntime
      ? 'src/database/migrations/*.ts'
      : 'dist/database/migrations/*.js',
  ],
  synchronize: false,
});

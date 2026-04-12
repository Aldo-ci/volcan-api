export const uuidColumnType =
  process.env.DB_TYPE === 'sqljs' ? 'varchar' : 'char';
export const saleStatusColumnType =
  process.env.DB_TYPE === 'sqljs' ? 'simple-enum' : 'enum';

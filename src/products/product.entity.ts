import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidColumnType } from '../database/column-types';
import { ProductCategory } from '../product-categories/product-category.entity';
import { SaleItem } from '../sales/sale-item.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryColumn({ type: uuidColumnType, length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  barcode?: string | null;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, default: '' })
  imageUrl!: string;

  @Column({ name: 'category_id', type: uuidColumnType, length: 36 })
  categoryId!: string;

  @Column({ name: 'regular_price', type: 'decimal', precision: 12, scale: 2 })
  regularPrice!: string;

  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  salePrice?: string | null;

  @Column({
    name: 'stock_quantity',
    type: 'int',
    unsigned: true,
    default: () => '0',
  })
  stockQuantity!: number;

  @Column({
    name: 'minimum_stock',
    type: 'int',
    unsigned: true,
    default: () => '0',
  })
  minimumStock!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size?: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: ProductCategory;

  @OneToMany(() => SaleItem, (item) => item.product)
  saleItems?: SaleItem[];
}

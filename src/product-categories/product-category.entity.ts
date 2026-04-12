import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidColumnType } from '../database/column-types';
import { Product } from '../products/product.entity';

@Entity({ name: 'product_categories' })
export class ProductCategory {
  @PrimaryColumn({ type: uuidColumnType, length: 36 })
  id!: string;

  @Column({
    name: 'legacy_product_type_id',
    type: 'varchar',
    length: 191,
    nullable: true,
    unique: true,
  })
  legacyProductTypeId?: string | null;

  @Column({ type: 'varchar', length: 120, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];
}

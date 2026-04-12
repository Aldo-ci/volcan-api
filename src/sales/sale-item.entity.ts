import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidColumnType } from '../database/column-types';
import { Product } from '../products/product.entity';
import { Sale } from './sale.entity';

@Entity({ name: 'sale_items' })
export class SaleItem {
  @PrimaryColumn({ type: uuidColumnType, length: 36 })
  id!: string;

  @Column({
    name: 'legacy_cash_sale_id',
    type: 'varchar',
    length: 191,
    nullable: true,
    unique: true,
  })
  legacyCashSaleId?: string | null;

  @Column({ name: 'sale_id', type: uuidColumnType, length: 36 })
  saleId!: string;

  @Column({ name: 'product_id', type: uuidColumnType, length: 36 })
  productId!: string;

  @Column({ type: 'int', unsigned: true })
  quantity!: number;

  @Column({
    name: 'product_name_snapshot',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  productNameSnapshot?: string | null;

  @Column({
    name: 'product_barcode_snapshot',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  productBarcodeSnapshot?: string | null;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unitPrice?: string | null;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: () => '0.00',
  })
  discountAmount!: string;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  lineTotal?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @ManyToOne(() => Product, (product) => product.saleItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}

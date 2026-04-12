import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { saleStatusColumnType, uuidColumnType } from '../database/column-types';
import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';

export enum SaleStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'sales' })
export class Sale {
  @PrimaryColumn({ type: uuidColumnType, length: 36 })
  id!: string;

  @Column({
    name: 'legacy_sale_id',
    type: 'varchar',
    length: 191,
    nullable: true,
    unique: true,
  })
  legacySaleId?: string | null;

  @Column({ name: 'occurred_at', type: 'datetime' })
  occurredAt!: Date;

  @Column({
    name: 'legacy_fecha_string',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  legacyFechaString?: string | null;

  @Column({
    name: 'created_by_user_id',
    type: uuidColumnType,
    length: 36,
    nullable: true,
  })
  createdByUserId?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  subtotal?: string | null;

  @Column({
    name: 'discount_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: () => '0.00',
  })
  discountTotal!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: string;

  @Column({
    name: 'has_discount',
    type: 'tinyint',
    width: 1,
    default: () => '0',
  })
  hasDiscount!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes?: string | null;

  @Column({
    type: saleStatusColumnType,
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status!: SaleStatus;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt?: Date | null;

  @Column({
    name: 'cancelled_by_user_id',
    type: uuidColumnType,
    length: 36,
    nullable: true,
  })
  cancelledByUserId?: string | null;

  @Column({
    name: 'cancellation_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  cancellationReason?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.createdSales, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User | null;

  @ManyToOne(() => User, (user) => user.cancelledSales, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'cancelled_by_user_id' })
  cancelledByUser?: User | null;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: false })
  items?: SaleItem[];
}

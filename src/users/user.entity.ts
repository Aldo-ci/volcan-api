import { Exclude } from 'class-transformer';
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
import { Role } from '../roles/role.entity';
import { Sale } from '../sales/sale.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ type: uuidColumnType, length: 36 })
  id!: string;

  @Column({
    name: 'legacy_user_id',
    type: 'varchar',
    length: 191,
    nullable: true,
    unique: true,
  })
  legacyUserId?: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'role_id', type: uuidColumnType, length: 36, nullable: true })
  roleId?: string | null;

  @Column({
    name: 'legacy_role_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  legacyRoleName?: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'role_id' })
  role?: Role | null;

  @OneToMany(() => Sale, (sale) => sale.createdByUser)
  createdSales?: Sale[];

  @OneToMany(() => Sale, (sale) => sale.cancelledByUser)
  cancelledSales?: Sale[];
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProductStatus {
  ON_SALE = 'ON_SALE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index('ix_products_seller_id')
  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer' })
  price!: number;

  @Column({ name: 'image_urls', type: 'text', array: true, default: '{}' })
  imageUrls!: string[];

  @Index('ix_products_status')
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ON_SALE,
  })
  status!: ProductStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;
}

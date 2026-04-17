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
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum TradeRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'trade_requests' })
export class TradeRequest {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index('ix_trade_requests_product_id')
  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @Index('ix_trade_requests_buyer_id')
  @Column({ name: 'buyer_id', type: 'bigint' })
  buyerId!: string;

  @Index('ix_trade_requests_seller_id')
  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  message!: string | null;

  @Index('ix_trade_requests_status')
  @Column({
    type: 'enum',
    enum: TradeRequestStatus,
    default: TradeRequestStatus.PENDING,
  })
  status!: TradeRequestStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;
}

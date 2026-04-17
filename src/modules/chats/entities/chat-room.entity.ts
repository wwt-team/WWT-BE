import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'chat_rooms' })
@Index('ux_chat_rooms_product_buyer_seller', ['productId', 'buyerId', 'sellerId'], {
  unique: true,
})
export class ChatRoom {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index('ix_chat_rooms_product_id')
  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @Index('ix_chat_rooms_buyer_id')
  @Column({ name: 'buyer_id', type: 'bigint' })
  buyerId!: string;

  @Index('ix_chat_rooms_seller_id')
  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId!: string;

  @JoinColumn({ name: 'product_id' })
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product!: Product;

  @JoinColumn({ name: 'buyer_id' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  buyer!: User;

  @JoinColumn({ name: 'seller_id' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  seller!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}

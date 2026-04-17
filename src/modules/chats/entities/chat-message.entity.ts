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
import { ChatRoom } from './chat-room.entity';

@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index('ix_chat_messages_chat_room_id')
  @Column({ name: 'chat_room_id', type: 'bigint' })
  chatRoomId!: string;

  @Index('ix_chat_messages_sender_id')
  @Column({ name: 'sender_id', type: 'bigint' })
  senderId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt!: Date | null;

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_room_id' })
  chatRoom!: ChatRoom;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}

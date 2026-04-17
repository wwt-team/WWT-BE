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

export enum RefreshTokenRevokedReason {
  LOGOUT = 'LOGOUT',
  ROTATED = 'ROTATED',
  REUSE_DETECTED = 'REUSE_DETECTED',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index('ix_refresh_tokens_user_id')
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Index('ix_refresh_tokens_token_hash')
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash!: string;

  @Index('ix_refresh_tokens_family_id')
  @Column({ name: 'family_id', type: 'varchar', length: 64 })
  familyId!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt!: Date | null;

  @Column({
    name: 'revoked_reason',
    type: 'enum',
    enum: RefreshTokenRevokedReason,
    nullable: true,
  })
  revokedReason!: RefreshTokenRevokedReason | null;

  @Column({ name: 'replaced_by_token_hash', type: 'varchar', length: 64, nullable: true })
  replacedByTokenHash!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}

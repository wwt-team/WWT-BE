import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'email_verifications' })
export class EmailVerification {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index('ix_email_verifications_email')
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 255 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Index('ix_email_verifications_token_hash')
  @Column({ name: 'token_hash', type: 'varchar', length: 64, nullable: true })
  tokenHash!: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt!: Date | null;

  @Column({ name: 'token_used_at', type: 'timestamp', nullable: true })
  tokenUsedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { ProfileEntity } from '../../profiles/entities/profile.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ default: 'email' })
  provider: string;

  @Column({ default: 'enthusiast' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ default: true })
  emailNotificationsEnabled: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, select: false })
  emailVerificationToken: string;

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpiry: Date;

  @Column({ default: false })
  isTeamAccount: boolean;

  @OneToOne(() => ProfileEntity, (profile) => profile.user)
  profile: ProfileEntity;
}

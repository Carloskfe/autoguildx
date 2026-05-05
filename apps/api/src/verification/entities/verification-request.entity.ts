import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { ProfileEntity } from '../../profiles/entities/profile.entity';

@Entity('verification_requests')
export class VerificationRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  profileId: string;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'denied';

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

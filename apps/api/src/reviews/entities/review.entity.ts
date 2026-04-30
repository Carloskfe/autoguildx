import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('reviews')
@Unique(['reviewerId', 'targetId', 'targetType'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reviewerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: UserEntity;

  @Column()
  targetId: string;

  @Column()
  targetType: string; // 'profile' | 'listing' | 'event'

  @Column({ type: 'int' })
  rating: number; // 1–5 overall

  @Column({ type: 'int', nullable: true })
  qualityRating: number;

  @Column({ type: 'int', nullable: true })
  communicationRating: number;

  @Column({ type: 'int', nullable: true })
  timelinessRating: number;

  @Column({ type: 'int', nullable: true })
  valueRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

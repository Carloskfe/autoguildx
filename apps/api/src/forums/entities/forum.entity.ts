import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('forums')
export class ForumEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column({ type: 'text', nullable: true })
  rules: string | null;

  @Column()
  createdByUserId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: UserEntity;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ default: 0 })
  postCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

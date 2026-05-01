import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ForumEntity } from './forum.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('forum_posts')
export class ForumPostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  forumId: string;

  @ManyToOne(() => ForumEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'forumId' })
  forum: ForumEntity;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', default: '' })
  mediaUrls: string[];

  @Column({ default: 0 })
  voteScore: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

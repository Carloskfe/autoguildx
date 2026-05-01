import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ForumPostEntity } from './forum-post.entity';

@Entity('forum_votes')
@Unique(['forumPostId', 'userId'])
export class ForumVoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  forumPostId: string;

  @ManyToOne(() => ForumPostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'forumPostId' })
  forumPost: ForumPostEntity;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  value: number;

  @CreateDateColumn()
  createdAt: Date;
}

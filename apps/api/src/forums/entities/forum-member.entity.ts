import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ForumEntity } from './forum.entity';

@Entity('forum_members')
@Unique(['forumId', 'userId'])
export class ForumMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  forumId: string;

  @ManyToOne(() => ForumEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'forumId' })
  forum: ForumEntity;

  @Column()
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;
}

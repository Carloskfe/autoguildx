import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CommentEntity } from '../../posts/entities/comment.entity';

@Entity('forum_comment_votes')
@Unique(['commentId', 'userId'])
export class ForumCommentVoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commentId: string;

  @ManyToOne(() => CommentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: CommentEntity;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  value: number;

  @CreateDateColumn()
  createdAt: Date;
}

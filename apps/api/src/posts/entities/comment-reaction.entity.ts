import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('comment_reactions')
@Unique(['commentId', 'userId'])
export class CommentReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commentId: string;

  @Column()
  userId: string;

  @Column()
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;
}

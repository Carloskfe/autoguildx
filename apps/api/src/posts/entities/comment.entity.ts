import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Column({ nullable: true })
  postId: string | null;

  @Column({ nullable: true })
  forumPostId: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  parentId: string | null;

  @ManyToOne(() => CommentEntity, (c) => c.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: CommentEntity;

  @OneToMany(() => CommentEntity, (c) => c.parent)
  replies: CommentEntity[];

  @Column({ default: 0 })
  voteScore: number;

  @CreateDateColumn()
  createdAt: Date;
}

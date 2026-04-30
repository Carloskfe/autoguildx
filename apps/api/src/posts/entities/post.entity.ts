import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', default: '' })
  mediaUrls: string[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: 0 })
  sharesCount: number;

  @Column({ default: 'public' })
  visibility: string; // public | followers | private

  @Column({ nullable: true })
  sharedPostId: string;

  @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sharedPostId' })
  sharedPost: PostEntity;

  @Column({ default: 'single' })
  mediaMode: string; // single | multi | carousel

  @Column({ nullable: true })
  linkUrl: string;

  @Column({ nullable: true })
  linkPreviewType: string; // youtube | link

  // Shared listing or event content snapshot
  @Column({ nullable: true })
  sharedContentType: string; // listing | event

  @Column({ nullable: true })
  sharedContentId: string;

  @Column({ type: 'text', nullable: true })
  sharedContent: string; // JSON snapshot: { title, subtitle, price, location, imageUrl, startDate }

  @CreateDateColumn()
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('post_reactions')
@Unique(['postId', 'userId'])
export class PostReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @Column()
  userId: string;

  @Column()
  emoji: string; // fire | love | respect | wild | like

  @CreateDateColumn()
  createdAt: Date;
}

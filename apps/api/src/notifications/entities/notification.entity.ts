import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // recipient

  @Column()
  actorId: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'actorId' })
  actor: UserEntity;

  @Column()
  type: string; // follow | reaction | comment | share | review

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  targetType: string; // post | profile | listing

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, unknown>;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

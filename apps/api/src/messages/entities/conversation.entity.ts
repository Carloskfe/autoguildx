import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  participantAId: string;

  @Column()
  participantBId: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'participantAId' })
  participantA: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'participantBId' })
  participantB: UserEntity;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

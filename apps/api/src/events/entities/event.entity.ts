import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'organizerId' })
  organizer: UserEntity;

  @Column()
  organizerId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'other' })
  type: string;

  @Column()
  location: string;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ type: 'simple-array', default: '' })
  mediaUrls: string[];

  @Column({ default: 0 })
  rsvpCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

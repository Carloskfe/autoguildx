import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('listings')
export class ListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', nullable: true })
  price: number;

  @Column()
  category: string;

  @Column({ type: 'simple-array', default: '' })
  vehicleTags: string[];

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'simple-array', default: '' })
  mediaUrls: string[];

  @Column({ default: 'active' })
  status: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  featuredUntil: Date;

  @CreateDateColumn()
  createdAt: Date;
}

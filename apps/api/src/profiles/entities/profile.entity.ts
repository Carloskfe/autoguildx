import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, (user) => user.profile)
  @JoinColumn()
  user: UserEntity;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  businessName: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 'individual' })
  roleType: string;

  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @ManyToMany(() => ProfileEntity)
  @JoinTable({
    name: 'profile_followers',
    joinColumn: { name: 'followerId' },
    inverseJoinColumn: { name: 'followingId' },
  })
  following: ProfileEntity[];

  @CreateDateColumn()
  createdAt: Date;
}

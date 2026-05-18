import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProfileEntity } from './profile.entity';

export type ProfileSectionType =
  | 'expertise'
  | 'experience'
  | 'build'
  | 'certification'
  | 'equipment';

@Entity('profile_sections')
export class ProfileSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: ProfileEntity;

  @Column()
  type: ProfileSectionType;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

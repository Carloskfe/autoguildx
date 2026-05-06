import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('certificates')
@Unique(['userId', 'courseId'])
export class CertificateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  courseId: string;

  @Column({ unique: true })
  certificateNumber: string;

  @ManyToOne(() => CourseEntity, { eager: false })
  @JoinColumn({ name: 'courseId' })
  course: CourseEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @CreateDateColumn()
  issuedAt: Date;
}

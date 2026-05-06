import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { LessonEntity } from './lesson.entity';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  instructorId: string;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'instructorId' })
  instructor: UserEntity;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ default: false })
  published: boolean;

  @Column({ default: 0 })
  lessonCount: number;

  @Column({ default: 0 })
  enrollmentCount: number;

  @OneToMany(() => LessonEntity, (l) => l.course, { cascade: true })
  lessons: LessonEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

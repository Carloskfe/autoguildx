import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';

@Entity('lessons')
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @ManyToOne(() => CourseEntity, (c) => c.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: CourseEntity;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  section: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: 0 })
  durationMinutes: number;

  @CreateDateColumn()
  createdAt: Date;
}

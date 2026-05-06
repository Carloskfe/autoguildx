import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('enrollments')
@Unique(['userId', 'courseId'])
export class EnrollmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  courseId: string;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  enrolledAt: Date;
}

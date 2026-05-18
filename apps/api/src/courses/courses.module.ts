import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseEntity } from './entities/course.entity';
import { LessonEntity } from './entities/lesson.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { LessonProgressEntity } from './entities/lesson-progress.entity';
import { CertificateEntity } from './entities/certificate.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      LessonEntity,
      EnrollmentEntity,
      LessonProgressEntity,
      CertificateEntity,
      UserEntity,
    ]),
    EmailModule,
  ],
  providers: [CoursesService],
  controllers: [CoursesController],
  exports: [CoursesService],
})
export class CoursesModule {}

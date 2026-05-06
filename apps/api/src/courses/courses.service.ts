import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { randomUUID } from 'crypto';
import { CourseEntity } from './entities/course.entity';
import { LessonEntity } from './entities/lesson.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { LessonProgressEntity } from './entities/lesson-progress.entity';
import { CertificateEntity } from './entities/certificate.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity) private courseRepo: Repository<CourseEntity>,
    @InjectRepository(LessonEntity) private lessonRepo: Repository<LessonEntity>,
    @InjectRepository(EnrollmentEntity) private enrollRepo: Repository<EnrollmentEntity>,
    @InjectRepository(LessonProgressEntity) private progressRepo: Repository<LessonProgressEntity>,
    @InjectRepository(CertificateEntity) private certRepo: Repository<CertificateEntity>,
  ) {}

  // ── Course CRUD ──────────────────────────────────────────────────────────────

  async create(instructorId: string, dto: CreateCourseDto): Promise<CourseEntity> {
    const slug = await this.uniqueSlug(dto.title);
    const course = this.courseRepo.create({
      instructorId,
      slug,
      title: dto.title,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      price: dto.price ?? 0,
      tags: dto.tags ?? [],
      level: dto.level ?? 'All Levels',
      objectives: dto.objectives ?? [],
      requirements: dto.requirements ?? [],
      published: dto.published ?? false,
    });
    return this.courseRepo.save(course);
  }

  async findAll(opts: { tag?: string; search?: string; page?: number; limit?: number }) {
    const page = Number.isFinite(opts.page) ? opts.page! : 1;
    const limit = Number.isFinite(opts.limit) ? opts.limit! : 20;

    const where: any = { published: true };
    if (opts.search) where.title = ILike(`%${opts.search}%`);

    let qb = this.courseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.instructor', 'u')
      .leftJoinAndSelect('u.profile', 'p')
      .where('c.published = true');

    if (opts.search) qb = qb.andWhere('c.title ILIKE :s', { s: `%${opts.search}%` });
    if (opts.tag) qb = qb.andWhere('c.tags ILIKE :t', { t: `%${opts.tag}%` });

    qb = qb.orderBy('c.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [courses, total] = await qb.getManyAndCount();
    return { courses, total, page, limit };
  }

  async findMyCourses(userId: string): Promise<CourseEntity[]> {
    return this.courseRepo.find({
      where: { instructorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId?: string) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['instructor', 'instructor.profile', 'lessons'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const lessons = (course.lessons ?? []).sort((a, b) => a.order - b.order);

    let enrollment: EnrollmentEntity | null = null;
    let completedLessonIds: string[] = [];

    if (userId) {
      enrollment = await this.enrollRepo.findOne({ where: { userId, courseId: id } }) ?? null;
      if (enrollment) {
        const progress = await this.progressRepo.find({ where: { userId, courseId: id } });
        completedLessonIds = progress.map((p) => p.lessonId);
      }
    }

    return { ...course, lessons, enrollment, completedLessonIds };
  }

  async update(id: string, instructorId: string, dto: Partial<CreateCourseDto>): Promise<CourseEntity> {
    const course = await this.getCourseAsInstructor(id, instructorId);
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async togglePublish(id: string, instructorId: string): Promise<CourseEntity> {
    const course = await this.getCourseAsInstructor(id, instructorId);
    course.published = !course.published;
    return this.courseRepo.save(course);
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const course = await this.getCourseAsInstructor(id, instructorId);
    await this.courseRepo.remove(course);
  }

  // ── Lessons ──────────────────────────────────────────────────────────────────

  async addLesson(courseId: string, instructorId: string, dto: CreateLessonDto): Promise<LessonEntity> {
    await this.getCourseAsInstructor(courseId, instructorId);
    const count = await this.lessonRepo.count({ where: { courseId } });
    const lesson = this.lessonRepo.create({
      courseId,
      title: dto.title,
      content: dto.content,
      videoUrl: dto.videoUrl,
      section: dto.section,
      order: dto.order ?? count,
      durationMinutes: dto.durationMinutes ?? 0,
    });
    const saved = await this.lessonRepo.save(lesson);
    await this.courseRepo.increment({ id: courseId }, 'lessonCount', 1);
    return saved;
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    instructorId: string,
    dto: Partial<CreateLessonDto>,
  ): Promise<LessonEntity> {
    await this.getCourseAsInstructor(courseId, instructorId);
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    Object.assign(lesson, dto);
    return this.lessonRepo.save(lesson);
  }

  async removeLesson(courseId: string, lessonId: string, instructorId: string): Promise<void> {
    await this.getCourseAsInstructor(courseId, instructorId);
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepo.remove(lesson);
    await this.courseRepo.decrement({ id: courseId }, 'lessonCount', 1);
  }

  // ── Enrollment ───────────────────────────────────────────────────────────────

  async enroll(userId: string, courseId: string): Promise<EnrollmentEntity> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, published: true } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.enrollRepo.findOne({ where: { userId, courseId } });
    if (existing) throw new ConflictException('Already enrolled');

    const enrollment = await this.enrollRepo.save(this.enrollRepo.create({ userId, courseId }));
    await this.courseRepo.increment({ id: courseId }, 'enrollmentCount', 1);
    return enrollment;
  }

  async getMyEnrollments(userId: string) {
    return this.enrollRepo.find({
      where: { userId },
      order: { enrolledAt: 'DESC' },
    });
  }

  // ── Progress ─────────────────────────────────────────────────────────────────

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    const enrollment = await this.enrollRepo.findOne({ where: { userId, courseId } });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.progressRepo.findOne({ where: { userId, lessonId } });
    if (!existing) {
      await this.progressRepo.save(this.progressRepo.create({ userId, lessonId, courseId }));
    }

    return this.checkAndIssueCertificate(userId, courseId, enrollment);
  }

  async getProgress(userId: string, courseId: string) {
    const [totalLessons, completed] = await Promise.all([
      this.lessonRepo.count({ where: { courseId } }),
      this.progressRepo.find({ where: { userId, courseId } }),
    ]);
    const completedIds = completed.map((p) => p.lessonId);
    const percentage = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;
    return { completedIds, total: totalLessons, completed: completedIds.length, percentage };
  }

  // ── Certificates ─────────────────────────────────────────────────────────────

  async getCertificate(userId: string, courseId: string): Promise<CertificateEntity | null> {
    return this.certRepo.findOne({ where: { userId, courseId }, relations: ['course'] }) ?? null;
  }

  async getMyCertificates(userId: string): Promise<CertificateEntity[]> {
    return this.certRepo.find({
      where: { userId },
      relations: ['course'],
      order: { issuedAt: 'DESC' },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async getCourseAsInstructor(id: string, instructorId: string): Promise<CourseEntity> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');
    return course;
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    let slug = base;
    let attempt = 0;
    while (await this.courseRepo.findOne({ where: { slug } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }

  private async checkAndIssueCertificate(
    userId: string,
    courseId: string,
    enrollment: EnrollmentEntity,
  ) {
    const progress = await this.getProgress(userId, courseId);
    if (progress.percentage < 100) return { progress };

    const existing = await this.certRepo.findOne({ where: { userId, courseId } });
    if (!existing) {
      const year = new Date().getFullYear();
      const suffix = randomUUID().slice(0, 8).toUpperCase();
      const certificateNumber = `AGX-${year}-${suffix}`;
      await this.certRepo.save(this.certRepo.create({ userId, courseId, certificateNumber }));
      enrollment.completedAt = new Date();
      await this.enrollRepo.save(enrollment);
    }

    return { progress, certificateIssued: !existing };
  }
}

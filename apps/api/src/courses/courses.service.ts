import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { CourseEntity } from './entities/course.entity';
import { LessonEntity } from './entities/lesson.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { LessonProgressEntity } from './entities/lesson-progress.entity';
import { CertificateEntity } from './entities/certificate.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { EmailService } from '../email/email.service';
import { UserEntity } from '../auth/entities/user.entity';
import { templates } from '../email/email.templates';
import { AnalyticsService } from '../analytics/analytics.service';

export type CourseSort = 'newest' | 'popular' | 'rating';

@Injectable()
export class CoursesService {
  private readonly stripe: InstanceType<typeof Stripe> | null;
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(CourseEntity) private courseRepo: Repository<CourseEntity>,
    @InjectRepository(LessonEntity) private lessonRepo: Repository<LessonEntity>,
    @InjectRepository(EnrollmentEntity) private enrollRepo: Repository<EnrollmentEntity>,
    @InjectRepository(LessonProgressEntity) private progressRepo: Repository<LessonProgressEntity>,
    @InjectRepository(CertificateEntity) private certRepo: Repository<CertificateEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly analytics: AnalyticsService,
  ) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as any })
      : null;
    if (!this.stripe) this.logger.warn('STRIPE_SECRET_KEY not set — course checkout disabled');
  }

  // ── Course CRUD ──────────────────────────────────────────────────────────────

  async create(instructorId: string, dto: CreateCourseDto): Promise<CourseEntity> {
    const slug = await this.uniqueSlug(dto.title);
    const course = this.courseRepo.create({
      instructorId,
      slug,
      title: dto.title,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      previewVideoUrl: dto.previewVideoUrl,
      price: dto.price ?? 0,
      tags: dto.tags ?? [],
      level: dto.level ?? 'All Levels',
      objectives: dto.objectives ?? [],
      requirements: dto.requirements ?? [],
      published: dto.published ?? false,
    });
    return this.courseRepo.save(course);
  }

  async findAll(opts: {
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: CourseSort;
  }) {
    const page = Number.isFinite(opts.page) ? opts.page! : 1;
    const limit = Number.isFinite(opts.limit) ? opts.limit! : 20;
    const sort: CourseSort = opts.sort ?? 'newest';

    let qb = this.courseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.instructor', 'u')
      .leftJoinAndSelect('u.profile', 'p')
      .where('c.published = true');

    if (opts.search) qb = qb.andWhere('c.title ILIKE :s', { s: `%${opts.search}%` });
    if (opts.tag) qb = qb.andWhere('c.tags ILIKE :t', { t: `%${opts.tag}%` });

    if (sort === 'rating') {
      qb = qb
        .orderBy(
          `(SELECT COALESCE(AVG(CAST(r.rating AS FLOAT)), 0) FROM reviews r WHERE r."targetId" = c.id AND r."targetType" = 'course')`,
          'DESC',
        )
        .addOrderBy('c.enrollmentCount', 'DESC');
    } else if (sort === 'popular') {
      qb = qb.orderBy('c.enrollmentCount', 'DESC').addOrderBy('c.createdAt', 'DESC');
    } else {
      qb = qb.orderBy('c.createdAt', 'DESC');
    }

    qb = qb.skip((page - 1) * limit).take(limit);

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
      enrollment = (await this.enrollRepo.findOne({ where: { userId, courseId: id } })) ?? null;
      if (enrollment) {
        const progress = await this.progressRepo.find({ where: { userId, courseId: id } });
        completedLessonIds = progress.map((p) => p.lessonId);
      }
    }

    return { ...course, lessons, enrollment, completedLessonIds };
  }

  async update(
    id: string,
    instructorId: string,
    dto: Partial<CreateCourseDto>,
  ): Promise<CourseEntity> {
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

  async addLesson(
    courseId: string,
    instructorId: string,
    dto: CreateLessonDto,
  ): Promise<LessonEntity> {
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

    if (Number(course.price) > 0 && course.instructorId !== userId) {
      throw new ForbiddenException('Payment required to enroll in this course');
    }

    const existing = await this.enrollRepo.findOne({ where: { userId, courseId } });
    if (existing) throw new ConflictException('Already enrolled');

    const enrollment = await this.enrollRepo.save(this.enrollRepo.create({ userId, courseId }));
    await this.courseRepo.increment({ id: courseId }, 'enrollmentCount', 1);
    return enrollment;
  }

  async enrollAfterPayment(userId: string, courseId: string): Promise<void> {
    const existing = await this.enrollRepo.findOne({ where: { userId, courseId } });
    if (!existing) {
      await this.enrollRepo.save(this.enrollRepo.create({ userId, courseId }));
      await this.courseRepo.increment({ id: courseId }, 'enrollmentCount', 1);
      this.logger.log(`Enrolled user ${userId} in course ${courseId} via Stripe payment`);
      this.analytics.capture(userId, 'course_enrolled', { course_id: courseId, method: 'paid' });
    }
  }

  async getMyEnrollments(userId: string) {
    return this.enrollRepo.find({
      where: { userId },
      order: { enrolledAt: 'DESC' },
    });
  }

  async getAllProgress(userId: string): Promise<{ courseId: string; percentage: number }[]> {
    const [enrollments, progresses] = await Promise.all([
      this.enrollRepo.find({ where: { userId } }),
      this.progressRepo.find({ where: { userId } }),
    ]);

    if (!enrollments.length) return [];

    const courseIds = enrollments.map((e) => e.courseId);
    const courses = await this.courseRepo.find({ where: { id: In(courseIds) } });

    return enrollments.map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      const completed = progresses.filter((p) => p.courseId === e.courseId).length;
      const total = course?.lessonCount ?? 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { courseId: e.courseId, percentage };
    });
  }

  // ── Stripe checkout ───────────────────────────────────────────────────────────

  async createCheckoutSession(userId: string, courseId: string) {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');

    const course = await this.courseRepo.findOne({ where: { id: courseId, published: true } });
    if (!course) throw new NotFoundException('Course not found');
    if (Number(course.price) === 0)
      throw new BadRequestException('This course is free — use direct enroll');

    const existing = await this.enrollRepo.findOne({ where: { userId, courseId } });
    if (existing) throw new ConflictException('Already enrolled');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              ...(course.thumbnailUrl ? { images: [course.thumbnailUrl] } : {}),
            },
            unit_amount: Math.round(Number(course.price) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/courses/${courseId}?payment=success`,
      cancel_url: `${frontendUrl}/courses/${courseId}`,
      metadata: { type: 'course_enrollment', userId, courseId },
    });

    return { url: session.url };
  }

  async handleCourseWebhook(rawBody: Buffer, sig: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
      return { received: true };
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { type, userId, courseId } = session.metadata ?? {};
      if (type === 'course_enrollment' && userId && courseId) {
        await this.enrollAfterPayment(userId, courseId);
      }
    }

    return { received: true };
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
    const percentage =
      totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;
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

      // Send completion email
      const [user, course] = await Promise.all([
        this.userRepo.findOne({ where: { id: userId } }),
        this.courseRepo.findOne({ where: { id: courseId } }),
      ]);
      if (user && course) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const certUrl = `${frontendUrl}/courses/${courseId}/certificate`;
        const tpl = templates.courseCompleted(course.title, certUrl);
        this.emailService.send({ to: user.email, ...tpl }).catch(() => {});
      }
      this.analytics.capture(userId, 'course_completed', { course_id: courseId });
    }

    return { progress, certificateIssued: !existing };
  }
}

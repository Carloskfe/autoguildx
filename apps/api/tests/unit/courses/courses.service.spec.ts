import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CoursesService } from '../../../src/courses/courses.service';
import { CourseEntity } from '../../../src/courses/entities/course.entity';
import { LessonEntity } from '../../../src/courses/entities/lesson.entity';
import { EnrollmentEntity } from '../../../src/courses/entities/enrollment.entity';
import { LessonProgressEntity } from '../../../src/courses/entities/lesson-progress.entity';
import { CertificateEntity } from '../../../src/courses/entities/certificate.entity';
import { UserEntity } from '../../../src/auth/entities/user.entity';
import { EmailService } from '../../../src/email/email.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  increment: jest.fn().mockResolvedValue(undefined),
  decrement: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
});

const makeCourse = (o: Partial<CourseEntity> = {}): CourseEntity =>
  ({
    id: 'c-1',
    instructorId: 'u-1',
    title: 'Test Course',
    slug: 'test-course',
    description: 'desc',
    price: 0,
    tags: [],
    published: true,
    lessonCount: 0,
    enrollmentCount: 0,
    lessons: [],
    ...o,
  }) as unknown as CourseEntity;

const makeLesson = (o: Partial<LessonEntity> = {}): LessonEntity =>
  ({ id: 'l-1', courseId: 'c-1', title: 'Lesson 1', order: 0, durationMinutes: 0, ...o }) as unknown as LessonEntity;

const makeEnrollment = (o: Partial<EnrollmentEntity> = {}): EnrollmentEntity =>
  ({ id: 'e-1', userId: 'u-2', courseId: 'c-1', enrolledAt: new Date(), ...o }) as unknown as EnrollmentEntity;

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepo: ReturnType<typeof mockRepo>;
  let lessonRepo: ReturnType<typeof mockRepo>;
  let enrollRepo: ReturnType<typeof mockRepo>;
  let progressRepo: ReturnType<typeof mockRepo>;
  let certRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let emailService: { send: jest.Mock };

  beforeEach(async () => {
    emailService = { send: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(CourseEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(LessonEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(EnrollmentEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(LessonProgressEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(CertificateEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(UserEntity), useFactory: mockRepo },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(CoursesService);
    courseRepo = module.get(getRepositoryToken(CourseEntity));
    lessonRepo = module.get(getRepositoryToken(LessonEntity));
    enrollRepo = module.get(getRepositoryToken(EnrollmentEntity));
    progressRepo = module.get(getRepositoryToken(LessonProgressEntity));
    certRepo = module.get(getRepositoryToken(CertificateEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and returns a course with auto slug', async () => {
      courseRepo.findOne.mockResolvedValue(null); // slug uniqueness check
      const course = makeCourse();
      courseRepo.create.mockReturnValue(course);
      courseRepo.save.mockResolvedValue(course);

      const result = await service.create('u-1', { title: 'Test Course' });
      expect(courseRepo.save).toHaveBeenCalled();
      expect(result).toEqual(course);
    });

    it('appends numeric suffix when slug already exists', async () => {
      courseRepo.findOne
        .mockResolvedValueOnce(makeCourse()) // slug 'test' taken
        .mockResolvedValueOnce(null);         // 'test-1' free
      courseRepo.create.mockReturnValue(makeCourse({ slug: 'test-1' }));
      courseRepo.save.mockResolvedValue(makeCourse({ slug: 'test-1' }));

      const result = await service.create('u-1', { title: 'test' });
      expect((result as any).slug).toBe('test-1');
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated published courses', async () => {
      const courses = [makeCourse()];
      courseRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([courses, 1]);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns course detail with sorted lessons and no enrollment for guest', async () => {
      const course = makeCourse({ lessons: [makeLesson({ order: 1 }), makeLesson({ id: 'l-2', order: 0 })] });
      courseRepo.findOne.mockResolvedValue(course);

      const result = await service.findById('c-1');
      expect(result.lessons[0].order).toBe(0);
      expect(result.enrollment).toBeNull();
    });

    it('throws NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });

    it('includes enrollment and progress for authenticated user', async () => {
      const course = makeCourse({ lessons: [makeLesson()] });
      courseRepo.findOne.mockResolvedValue(course);
      enrollRepo.findOne.mockResolvedValue(makeEnrollment());
      progressRepo.find.mockResolvedValue([{ lessonId: 'l-1' }]);

      const result = await service.findById('c-1', 'u-2');
      expect(result.enrollment).toBeTruthy();
      expect(result.completedLessonIds).toContain('l-1');
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates course fields', async () => {
      const course = makeCourse();
      courseRepo.findOne.mockResolvedValue(course);
      courseRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.update('c-1', 'u-1', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('throws ForbiddenException for non-instructor', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse({ instructorId: 'u-1' }));
      await expect(service.update('c-1', 'u-other', { title: 'X' })).rejects.toThrow(ForbiddenException);
    });
  });

  // ── togglePublish ─────────────────────────────────────────────────────────────

  describe('togglePublish', () => {
    it('flips the published flag', async () => {
      const course = makeCourse({ published: false });
      courseRepo.findOne.mockResolvedValue(course);
      courseRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.togglePublish('c-1', 'u-1');
      expect(result.published).toBe(true);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes the course when instructor matches', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse());
      courseRepo.remove.mockResolvedValue({});
      await service.remove('c-1', 'u-1');
      expect(courseRepo.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad', 'u-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── addLesson ─────────────────────────────────────────────────────────────────

  describe('addLesson', () => {
    it('creates a lesson and increments lessonCount', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse());
      lessonRepo.count.mockResolvedValue(0);
      const lesson = makeLesson();
      lessonRepo.create.mockReturnValue(lesson);
      lessonRepo.save.mockResolvedValue(lesson);

      const result = await service.addLesson('c-1', 'u-1', { title: 'Lesson 1' });
      expect(result).toEqual(lesson);
      expect(courseRepo.increment).toHaveBeenCalledWith({ id: 'c-1' }, 'lessonCount', 1);
    });

    it('throws ForbiddenException for non-instructor', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse({ instructorId: 'u-1' }));
      await expect(service.addLesson('c-1', 'u-other', { title: 'X' })).rejects.toThrow(ForbiddenException);
    });
  });

  // ── removeLesson ──────────────────────────────────────────────────────────────

  describe('removeLesson', () => {
    it('removes lesson and decrements lessonCount', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse());
      lessonRepo.findOne.mockResolvedValue(makeLesson());
      lessonRepo.remove.mockResolvedValue({});

      await service.removeLesson('c-1', 'l-1', 'u-1');
      expect(lessonRepo.remove).toHaveBeenCalled();
      expect(courseRepo.decrement).toHaveBeenCalledWith({ id: 'c-1' }, 'lessonCount', 1);
    });

    it('throws NotFoundException when lesson not found', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse());
      lessonRepo.findOne.mockResolvedValue(null);
      await expect(service.removeLesson('c-1', 'bad', 'u-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── enroll ────────────────────────────────────────────────────────────────────

  describe('enroll', () => {
    it('creates enrollment and increments enrollmentCount for free course', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse({ price: 0 }));
      enrollRepo.findOne.mockResolvedValue(null);
      const enrollment = makeEnrollment();
      enrollRepo.create.mockReturnValue(enrollment);
      enrollRepo.save.mockResolvedValue(enrollment);

      const result = await service.enroll('u-2', 'c-1');
      expect(result).toEqual(enrollment);
      expect(courseRepo.increment).toHaveBeenCalledWith({ id: 'c-1' }, 'enrollmentCount', 1);
    });

    it('throws ForbiddenException when enrolling in a paid course without payment', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse({ price: 49.99, instructorId: 'u-1' }));
      enrollRepo.findOne.mockResolvedValue(null);
      await expect(service.enroll('u-2', 'c-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows instructor to enroll in their own paid course', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse({ price: 49.99, instructorId: 'u-1' }));
      enrollRepo.findOne.mockResolvedValue(null);
      const enrollment = makeEnrollment({ userId: 'u-1' });
      enrollRepo.create.mockReturnValue(enrollment);
      enrollRepo.save.mockResolvedValue(enrollment);
      const result = await service.enroll('u-1', 'c-1');
      expect(result).toEqual(enrollment);
    });

    it('throws ConflictException when already enrolled', async () => {
      courseRepo.findOne.mockResolvedValue(makeCourse());
      enrollRepo.findOne.mockResolvedValue(makeEnrollment());
      await expect(service.enroll('u-2', 'c-1')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when course not published', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.enroll('u-2', 'c-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAllProgress ─────────────────────────────────────────────────────────────

  describe('getAllProgress', () => {
    it('returns empty array when not enrolled in any course', async () => {
      enrollRepo.find.mockResolvedValue([]);
      progressRepo.find.mockResolvedValue([]);
      const result = await service.getAllProgress('u-2');
      expect(result).toEqual([]);
    });

    it('computes percentage per enrolled course', async () => {
      enrollRepo.find.mockResolvedValue([makeEnrollment({ courseId: 'c-1' })]);
      progressRepo.find.mockResolvedValue([{ courseId: 'c-1', lessonId: 'l-1' }]);
      courseRepo.find.mockResolvedValue([makeCourse({ id: 'c-1', lessonCount: 2 })]);
      const result = await service.getAllProgress('u-2');
      expect(result[0]).toEqual({ courseId: 'c-1', percentage: 50 });
    });
  });

  // ── createCheckoutSession ─────────────────────────────────────────────────────

  describe('createCheckoutSession', () => {
    it('throws BadRequestException when Stripe is not configured', async () => {
      // stripe is null when no STRIPE_SECRET_KEY
      await expect(service.createCheckoutSession('u-2', 'c-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when course not found', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.createCheckoutSession('u-2', 'c-1')).rejects.toThrow();
    });
  });

  // ── completeLesson ────────────────────────────────────────────────────────────

  describe('completeLesson', () => {
    it('throws ForbiddenException when not enrolled', async () => {
      enrollRepo.findOne.mockResolvedValue(null);
      await expect(service.completeLesson('u-2', 'c-1', 'l-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when lesson does not belong to course', async () => {
      enrollRepo.findOne.mockResolvedValue(makeEnrollment());
      lessonRepo.findOne.mockResolvedValue(null);
      await expect(service.completeLesson('u-2', 'c-1', 'bad')).rejects.toThrow(NotFoundException);
    });

    it('saves progress and returns percentage', async () => {
      enrollRepo.findOne.mockResolvedValue(makeEnrollment());
      lessonRepo.findOne.mockResolvedValue(makeLesson());
      progressRepo.findOne.mockResolvedValue(null);
      progressRepo.create.mockReturnValue({ userId: 'u-2', lessonId: 'l-1', courseId: 'c-1' });
      progressRepo.save.mockResolvedValue({});
      lessonRepo.count.mockResolvedValue(1);
      progressRepo.find.mockResolvedValue([{ lessonId: 'l-1' }]);
      certRepo.findOne.mockResolvedValue(null);
      certRepo.create.mockReturnValue({});
      certRepo.save.mockResolvedValue({});
      enrollRepo.save.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue({ id: 'u-2', email: 'u@test.com' });
      courseRepo.findOne.mockResolvedValue(makeCourse());

      const result = await service.completeLesson('u-2', 'c-1', 'l-1');
      expect((result as any).progress.percentage).toBe(100);
      expect((result as any).certificateIssued).toBe(true);
    });

    it('does not re-issue certificate if already earned', async () => {
      enrollRepo.findOne.mockResolvedValue(makeEnrollment());
      lessonRepo.findOne.mockResolvedValue(makeLesson());
      progressRepo.findOne.mockResolvedValue({ id: 'p-1' });
      lessonRepo.count.mockResolvedValue(1);
      progressRepo.find.mockResolvedValue([{ lessonId: 'l-1' }]);
      certRepo.findOne.mockResolvedValue({ id: 'cert-1' });

      const result = await service.completeLesson('u-2', 'c-1', 'l-1');
      expect(certRepo.save).not.toHaveBeenCalled();
      expect((result as any).certificateIssued).toBe(false);
    });
  });

  // ── getProgress ───────────────────────────────────────────────────────────────

  describe('getProgress', () => {
    it('returns 0% when no lessons completed', async () => {
      lessonRepo.count.mockResolvedValue(4);
      progressRepo.find.mockResolvedValue([]);
      const result = await service.getProgress('u-2', 'c-1');
      expect(result.percentage).toBe(0);
      expect(result.total).toBe(4);
    });

    it('returns 50% when half the lessons are done', async () => {
      lessonRepo.count.mockResolvedValue(4);
      progressRepo.find.mockResolvedValue([{ lessonId: 'l-1' }, { lessonId: 'l-2' }]);
      const result = await service.getProgress('u-2', 'c-1');
      expect(result.percentage).toBe(50);
    });

    it('returns 0% when course has no lessons', async () => {
      lessonRepo.count.mockResolvedValue(0);
      progressRepo.find.mockResolvedValue([]);
      expect((await service.getProgress('u-2', 'c-1')).percentage).toBe(0);
    });
  });

  // ── getMyCertificates ─────────────────────────────────────────────────────────

  describe('getMyCertificates', () => {
    it('returns all certificates for user', async () => {
      const certs = [{ id: 'cert-1', userId: 'u-2', courseId: 'c-1' }];
      certRepo.find.mockResolvedValue(certs);
      const result = await service.getMyCertificates('u-2');
      expect(result).toEqual(certs);
    });
  });
});

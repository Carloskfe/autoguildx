import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from '../../../src/notifications/notifications.service';
import { NotificationEntity } from '../../../src/notifications/entities/notification.entity';
import { UserEntity } from '../../../src/auth/entities/user.entity';
import { EmailService } from '../../../src/email/email.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
});

const mockEmailService = () => ({ send: jest.fn().mockResolvedValue(undefined) });

const notif = (overrides = {}): Partial<NotificationEntity> => ({
  id: 'n-1',
  userId: 'u-recipient',
  actorId: 'u-actor',
  type: 'reaction',
  targetId: 'post-1',
  targetType: 'post',
  isRead: false,
  createdAt: new Date(),
  ...overrides,
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let emailService: ReturnType<typeof mockEmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(UserEntity), useFactory: mockRepo },
        { provide: EmailService, useFactory: mockEmailService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repo = module.get(getRepositoryToken(NotificationEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));
    emailService = module.get(EmailService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('saves a notification when actor and recipient differ', async () => {
      const n = notif();
      repo.create.mockReturnValue(n);
      repo.save.mockResolvedValue(n);
      userRepo.findOne.mockResolvedValue(null); // no email lookup match needed

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'reaction' });
      expect(repo.save).toHaveBeenCalled();
    });

    it('does not save when actor and recipient are the same user', async () => {
      await service.create({ userId: 'u-1', actorId: 'u-1', type: 'reaction' });
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('sends email on verification_approved', async () => {
      repo.create.mockReturnValue(notif({ type: 'verification_approved' }));
      repo.save.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue({ id: 'u-recipient', email: 'user@test.com', emailNotificationsEnabled: true });

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'verification_approved' });

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com' }),
      );
    });

    it('sends email on verification_denied', async () => {
      repo.create.mockReturnValue(notif({ type: 'verification_denied' }));
      repo.save.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue({ id: 'u-recipient', email: 'user@test.com', emailNotificationsEnabled: true });

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'verification_denied' });

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com' }),
      );
    });

    it('sends email on review type with rating in data', async () => {
      repo.create.mockReturnValue(notif({ type: 'review' }));
      repo.save.mockResolvedValue({});
      userRepo.findOne
        .mockResolvedValueOnce({ id: 'u-recipient', email: 'user@test.com', emailNotificationsEnabled: true })
        .mockResolvedValueOnce({ id: 'u-actor', email: 'actor@test.com', profile: { name: 'John' } });

      await service.create({
        userId: 'u-recipient',
        actorId: 'u-actor',
        type: 'review',
        data: { rating: 4 },
      });

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com', subject: expect.stringContaining('4-star') }),
      );
    });

    it('does not send email for non-email notification types', async () => {
      repo.create.mockReturnValue(notif());
      repo.save.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue(null);

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'reaction' });

      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('does not send email when recipient has no email address', async () => {
      repo.create.mockReturnValue(notif({ type: 'verification_approved' }));
      repo.save.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue(null);

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'verification_approved' });

      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('does not send email when recipient has emailNotificationsEnabled=false', async () => {
      repo.create.mockReturnValue(notif({ type: 'verification_approved' }));
      repo.save.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue({
        id: 'u-recipient',
        email: 'user@test.com',
        emailNotificationsEnabled: false,
      });

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'verification_approved' });

      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  // ── getEmailSettings ──────────────────────────────────────────────────────────

  describe('getEmailSettings', () => {
    it('returns emailNotificationsEnabled=true when user has it enabled', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u-1', emailNotificationsEnabled: true });
      expect(await service.getEmailSettings('u-1')).toEqual({ emailNotificationsEnabled: true });
    });

    it('returns emailNotificationsEnabled=false when user has it disabled', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u-1', emailNotificationsEnabled: false });
      expect(await service.getEmailSettings('u-1')).toEqual({ emailNotificationsEnabled: false });
    });

    it('defaults to true when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      expect(await service.getEmailSettings('u-unknown')).toEqual({ emailNotificationsEnabled: true });
    });
  });

  // ── updateEmailSettings ───────────────────────────────────────────────────────

  describe('updateEmailSettings', () => {
    it('updates the preference and returns the new value', async () => {
      userRepo.update = jest.fn().mockResolvedValue({ affected: 1 });
      expect(await service.updateEmailSettings('u-1', false)).toEqual({
        emailNotificationsEnabled: false,
      });
      expect(userRepo.update).toHaveBeenCalledWith(
        { id: 'u-1' },
        { emailNotificationsEnabled: false },
      );
    });

    it('can re-enable notifications', async () => {
      userRepo.update = jest.fn().mockResolvedValue({ affected: 1 });
      expect(await service.updateEmailSettings('u-1', true)).toEqual({
        emailNotificationsEnabled: true,
      });
    });
  });

  // ── getNotifications ─────────────────────────────────────────────────────────

  describe('getNotifications', () => {
    it('returns paginated notifications', async () => {
      const notifications = [notif(), notif({ id: 'n-2' })];
      repo.find.mockResolvedValue(notifications);

      const result = await service.getNotifications('u-recipient', 1, 20);
      expect(result).toEqual(notifications);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u-recipient' }, skip: 0, take: 20 }),
      );
    });

    it('applies correct offset for page 2', async () => {
      repo.find.mockResolvedValue([]);
      await service.getNotifications('u-1', 2, 10);
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    });
  });

  // ── getUnreadCount ───────────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns the unread count', async () => {
      repo.count.mockResolvedValue(3);
      expect(await service.getUnreadCount('u-1')).toEqual({ count: 3 });
    });
  });

  // ── markRead ─────────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('updates the specific notification as read', async () => {
      repo.update.mockResolvedValue({ affected: 1 });
      expect(await service.markRead('n-1', 'u-1')).toEqual({ updated: true });
      expect(repo.update).toHaveBeenCalledWith({ id: 'n-1', userId: 'u-1' }, { isRead: true });
    });
  });

  // ── markAllRead ──────────────────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('marks all unread notifications as read for the user', async () => {
      repo.update.mockResolvedValue({ affected: 5 });
      expect(await service.markAllRead('u-1')).toEqual({ updated: true });
      expect(repo.update).toHaveBeenCalledWith({ userId: 'u-1', isRead: false }, { isRead: true });
    });
  });
});

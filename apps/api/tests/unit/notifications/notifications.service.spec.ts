import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from '../../../src/notifications/notifications.service';
import { NotificationEntity } from '../../../src/notifications/entities/notification.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repo = module.get(getRepositoryToken(NotificationEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('saves a notification when actor and recipient differ', async () => {
      const n = notif();
      repo.create.mockReturnValue(n);
      repo.save.mockResolvedValue(n);

      await service.create({ userId: 'u-recipient', actorId: 'u-actor', type: 'reaction' });
      expect(repo.save).toHaveBeenCalled();
    });

    it('does not save when actor and recipient are the same user', async () => {
      await service.create({ userId: 'u-1', actorId: 'u-1', type: 'reaction' });
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  describe('getUnreadCount', () => {
    it('returns the unread count', async () => {
      repo.count.mockResolvedValue(3);
      expect(await service.getUnreadCount('u-1')).toEqual({ count: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  describe('markRead', () => {
    it('updates the specific notification as read', async () => {
      repo.update.mockResolvedValue({ affected: 1 });
      expect(await service.markRead('n-1', 'u-1')).toEqual({ updated: true });
      expect(repo.update).toHaveBeenCalledWith({ id: 'n-1', userId: 'u-1' }, { isRead: true });
    });
  });

  // ---------------------------------------------------------------------------
  describe('markAllRead', () => {
    it('marks all unread notifications as read for the user', async () => {
      repo.update.mockResolvedValue({ affected: 5 });
      expect(await service.markAllRead('u-1')).toEqual({ updated: true });
      expect(repo.update).toHaveBeenCalledWith({ userId: 'u-1', isRead: false }, { isRead: true });
    });
  });
});

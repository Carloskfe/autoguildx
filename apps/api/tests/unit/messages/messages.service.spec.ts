import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesService } from '../../../src/messages/messages.service';
import { ConversationEntity } from '../../../src/messages/entities/conversation.entity';
import { MessageEntity } from '../../../src/messages/entities/message.entity';

const qbMock = () => ({
  select: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getCount: jest.fn(),
});

const mockConvRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockMsgRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const conv = (overrides = {}): ConversationEntity =>
  ({
    id: 'conv-1',
    participantAId: 'u-1',
    participantBId: 'u-2',
    lastMessageAt: null,
    createdAt: new Date(),
    ...overrides,
  }) as ConversationEntity;

describe('MessagesService', () => {
  let service: MessagesService;
  let convRepo: ReturnType<typeof mockConvRepo>;
  let msgRepo: ReturnType<typeof mockMsgRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(ConversationEntity), useFactory: mockConvRepo },
        { provide: getRepositoryToken(MessageEntity), useFactory: mockMsgRepo },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    convRepo = module.get(getRepositoryToken(ConversationEntity));
    msgRepo = module.get(getRepositoryToken(MessageEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  describe('getOrCreateConversation', () => {
    it('throws BadRequestException when user messages themselves', async () => {
      await expect(service.getOrCreateConversation('u-1', 'u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns existing conversation when one is found', async () => {
      const qb = qbMock();
      qb.getOne.mockResolvedValue(conv());
      convRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getOrCreateConversation('u-1', 'u-2');
      expect(result).toEqual(conv());
      expect(convRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new conversation when none exists', async () => {
      const qb = qbMock();
      qb.getOne.mockResolvedValue(null);
      convRepo.createQueryBuilder.mockReturnValue(qb);
      const c = conv();
      convRepo.create.mockReturnValue(c);
      convRepo.save.mockResolvedValue(c);
      convRepo.findOne.mockResolvedValue(c);

      const result = await service.getOrCreateConversation('u-1', 'u-2');
      expect(convRepo.create).toHaveBeenCalledWith({ participantAId: 'u-1', participantBId: 'u-2' });
      expect(result).toBe(c);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getConversations', () => {
    it('returns conversations enriched with lastMessage and unreadCount', async () => {
      const qb = qbMock();
      qb.getMany.mockResolvedValue([conv()]);
      convRepo.createQueryBuilder.mockReturnValue(qb);

      const lastMsg = { id: 'msg-1', content: 'hello', createdAt: new Date() };
      msgRepo.findOne.mockResolvedValue(lastMsg);
      msgRepo.count.mockResolvedValue(2);

      const result = await service.getConversations('u-1');
      expect(result).toHaveLength(1);
      expect(result[0].lastMessage).toEqual(lastMsg);
      expect(result[0].unreadCount).toBe(2);
    });

    it('returns empty array when user has no conversations', async () => {
      const qb = qbMock();
      qb.getMany.mockResolvedValue([]);
      convRepo.createQueryBuilder.mockReturnValue(qb);

      expect(await service.getConversations('u-1')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getMessages', () => {
    it('throws NotFoundException when conversation does not exist', async () => {
      convRepo.findOne.mockResolvedValue(null);
      await expect(service.getMessages('conv-x', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      convRepo.findOne.mockResolvedValue(conv({ participantAId: 'u-3', participantBId: 'u-4' }));
      await expect(service.getMessages('conv-1', 'u-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns messages and marks incoming ones as read', async () => {
      convRepo.findOne.mockResolvedValue(conv());
      const msgs = [
        { id: 'msg-1', senderId: 'u-2', isRead: false, conversationId: 'conv-1' },
        { id: 'msg-2', senderId: 'u-1', isRead: false, conversationId: 'conv-1' },
      ];
      msgRepo.find.mockResolvedValue(msgs);
      msgRepo.save.mockResolvedValue([]);

      const result = await service.getMessages('conv-1', 'u-1');
      expect(result).toEqual(msgs);
      // only msg-1 (from u-2) should be marked read
      expect(msgRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'msg-1', isRead: true }),
      ]);
    });

    it('skips save when all messages are already read', async () => {
      convRepo.findOne.mockResolvedValue(conv());
      const msgs = [{ id: 'msg-1', senderId: 'u-2', isRead: true, conversationId: 'conv-1' }];
      msgRepo.find.mockResolvedValue(msgs);

      await service.getMessages('conv-1', 'u-1');
      expect(msgRepo.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('sendMessage', () => {
    it('throws NotFoundException when conversation does not exist', async () => {
      convRepo.findOne.mockResolvedValue(null);
      await expect(service.sendMessage('conv-x', 'u-1', 'hi')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when sender is not a participant', async () => {
      convRepo.findOne.mockResolvedValue(conv({ participantAId: 'u-3', participantBId: 'u-4' }));
      await expect(service.sendMessage('conv-1', 'u-1', 'hi')).rejects.toThrow(ForbiddenException);
    });

    it('saves the message, updates lastMessageAt, and returns the saved message with sender', async () => {
      const c = conv();
      convRepo.findOne.mockResolvedValue(c);
      const saved = { id: 'msg-new', conversationId: 'conv-1', senderId: 'u-1', content: 'hi', createdAt: new Date() };
      msgRepo.create.mockReturnValue(saved);
      msgRepo.save.mockResolvedValue(saved);
      msgRepo.findOne.mockResolvedValue({ ...saved, sender: { id: 'u-1' } });

      const result = await service.sendMessage('conv-1', 'u-1', 'hi');
      expect(convRepo.save).toHaveBeenCalledWith(expect.objectContaining({ lastMessageAt: saved.createdAt }));
      expect(result).toMatchObject({ id: 'msg-new', sender: { id: 'u-1' } });
    });
  });

  // ---------------------------------------------------------------------------
  describe('getUnreadCount', () => {
    it('returns 0 when user has no conversations', async () => {
      const qb = qbMock();
      qb.getMany.mockResolvedValue([]);
      convRepo.createQueryBuilder.mockReturnValue(qb);

      expect(await service.getUnreadCount('u-1')).toEqual({ count: 0 });
    });

    it('returns correct unread count across conversations', async () => {
      const convQb = qbMock();
      convQb.getMany.mockResolvedValue([{ id: 'conv-1' }, { id: 'conv-2' }]);
      convRepo.createQueryBuilder.mockReturnValue(convQb);

      const msgQb = qbMock();
      msgQb.getCount.mockResolvedValue(5);
      msgRepo.createQueryBuilder.mockReturnValue(msgQb);

      expect(await service.getUnreadCount('u-1')).toEqual({ count: 5 });
    });
  });
});

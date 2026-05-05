import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VerificationService } from '../../../src/verification/verification.service';
import { VerificationRequestEntity } from '../../../src/verification/entities/verification-request.entity';
import { ProfileEntity } from '../../../src/profiles/entities/profile.entity';
import { NotificationsService } from '../../../src/notifications/notifications.service';

const mockRequestRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockProfileRepo = () => ({
  update: jest.fn(),
});

const mockNotificationsService = () => ({
  create: jest.fn(),
});

describe('VerificationService', () => {
  let service: VerificationService;
  let requestRepo: ReturnType<typeof mockRequestRepo>;
  let profileRepo: ReturnType<typeof mockProfileRepo>;
  let notificationsService: ReturnType<typeof mockNotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: getRepositoryToken(VerificationRequestEntity), useFactory: mockRequestRepo },
        { provide: getRepositoryToken(ProfileEntity), useFactory: mockProfileRepo },
        { provide: NotificationsService, useFactory: mockNotificationsService },
      ],
    }).compile();

    service = module.get(VerificationService);
    requestRepo = module.get(getRepositoryToken(VerificationRequestEntity));
    profileRepo = module.get(getRepositoryToken(ProfileEntity));
    notificationsService = module.get(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── requestVerification ──────────────────────────────────────────────────────

  describe('requestVerification', () => {
    it('creates and saves a new pending request', async () => {
      requestRepo.findOne.mockResolvedValue(null);
      const created = { id: 'req1', userId: 'u1', profileId: 'p1', status: 'pending' };
      requestRepo.create.mockReturnValue(created);
      requestRepo.save.mockResolvedValue(created);

      const result = await service.requestVerification('u1', 'p1');

      expect(requestRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1', status: 'pending' } });
      expect(requestRepo.create).toHaveBeenCalledWith({ userId: 'u1', profileId: 'p1', status: 'pending' });
      expect(result).toEqual(created);
    });

    it('throws ConflictException when a pending request already exists', async () => {
      requestRepo.findOne.mockResolvedValue({ id: 'req1', status: 'pending' });

      await expect(service.requestVerification('u1', 'p1')).rejects.toThrow(ConflictException);
      expect(requestRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── getPendingRequests ───────────────────────────────────────────────────────

  describe('getPendingRequests', () => {
    it('returns all pending requests ordered by createdAt ASC', async () => {
      const pending = [{ id: 'req1' }, { id: 'req2' }];
      requestRepo.find.mockResolvedValue(pending);

      const result = await service.getPendingRequests();

      expect(requestRepo.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
        relations: ['profile', 'user'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(pending);
    });

    it('returns empty array when no pending requests', async () => {
      requestRepo.find.mockResolvedValue([]);

      const result = await service.getPendingRequests();
      expect(result).toEqual([]);
    });
  });

  // ── reviewRequest ────────────────────────────────────────────────────────────

  describe('reviewRequest', () => {
    const baseReq = { id: 'req1', userId: 'u1', profileId: 'p1', status: 'pending', note: null };

    it('approves a request — sets status approved and marks profile isVerified', async () => {
      requestRepo.findOne.mockResolvedValue({ ...baseReq });
      const saved = { ...baseReq, status: 'approved' };
      requestRepo.save.mockResolvedValue(saved);
      notificationsService.create.mockResolvedValue(undefined);

      const result = await service.reviewRequest('req1', 'approve', 'admin1');

      expect(requestRepo.findOne).toHaveBeenCalledWith({ where: { id: 'req1' } });
      expect(profileRepo.update).toHaveBeenCalledWith({ id: 'p1' }, { isVerified: true });
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'verification_approved' }),
      );
      expect(result.status).toBe('approved');
    });

    it('denies a request — sets status denied, does NOT set isVerified', async () => {
      requestRepo.findOne.mockResolvedValue({ ...baseReq });
      const saved = { ...baseReq, status: 'denied' };
      requestRepo.save.mockResolvedValue(saved);
      notificationsService.create.mockResolvedValue(undefined);

      const result = await service.reviewRequest('req1', 'deny', 'admin1', 'Not enough info');

      expect(profileRepo.update).not.toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'verification_denied' }),
      );
      expect(result.status).toBe('denied');
    });

    it('saves note on the request when provided', async () => {
      const req = { ...baseReq };
      requestRepo.findOne.mockResolvedValue(req);
      requestRepo.save.mockImplementation((r) => Promise.resolve(r));
      notificationsService.create.mockResolvedValue(undefined);

      await service.reviewRequest('req1', 'deny', 'admin1', 'Insufficient proof');

      expect(requestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'Insufficient proof' }),
      );
    });

    it('throws NotFoundException when request does not exist', async () => {
      requestRepo.findOne.mockResolvedValue(null);

      await expect(service.reviewRequest('bad-id', 'approve', 'admin1')).rejects.toThrow(
        NotFoundException,
      );
      expect(profileRepo.update).not.toHaveBeenCalled();
    });
  });

  // ── getMyRequestStatus ───────────────────────────────────────────────────────

  describe('getMyRequestStatus', () => {
    it('returns null when no request exists for user', async () => {
      requestRepo.findOne.mockResolvedValue(null);

      const result = await service.getMyRequestStatus('u1');
      expect(result).toBeNull();
    });

    it('returns status object when a request exists', async () => {
      requestRepo.findOne.mockResolvedValue({ id: 'req1', status: 'pending' });

      const result = await service.getMyRequestStatus('u1');
      expect(result).toEqual({ status: 'pending' });
    });

    it('returns approved status', async () => {
      requestRepo.findOne.mockResolvedValue({ id: 'req1', status: 'approved' });

      const result = await service.getMyRequestStatus('u1');
      expect(result).toEqual({ status: 'approved' });
    });
  });
});

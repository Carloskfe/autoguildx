import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/auth/auth.service';
import { UserEntity } from '../../../src/auth/entities/user.entity';
import { EmailService } from '../../../src/email/email.service';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('test-token'),
});

const mockEmailService = () => ({
  send: jest.fn().mockResolvedValue(undefined),
});

const mockConfigService = () => ({
  get: jest.fn().mockImplementation((key: string, fallback?: string) => fallback ?? 'http://localhost:3000'),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let emailService: ReturnType<typeof mockEmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useFactory: mockUserRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: EmailService, useFactory: mockEmailService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    emailService = module.get(EmailService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('signup', () => {
    it('creates a user and returns an access token', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const newUser = { id: 'uid-1', email: 'a@a.com', role: 'enthusiast' };
      userRepo.create.mockReturnValue(newUser);
      userRepo.save.mockResolvedValue(newUser);

      const result = await service.signup({ email: 'a@a.com', password: 'pass', role: 'enthusiast' });

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
      expect(result.accessToken).toBe('test-token');
      expect(result.userId).toBe('uid-1');
      expect(result.emailVerified).toBe(false);
    });

    it('throws ConflictException when email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid-1' });
      await expect(service.signup({ email: 'a@a.com', password: 'pass' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('hashes the password before saving', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((dto) => dto);
      userRepo.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'uid-1' }));

      await service.signup({ email: 'a@a.com', password: 'plaintext' });

      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg.passwordHash).toBeDefined();
      expect(createArg.passwordHash).not.toBe('plaintext');
    });

    it('defaults role to enthusiast when not provided', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((dto) => dto);
      userRepo.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'uid-1' }));

      await service.signup({ email: 'a@a.com', password: 'pass' });

      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg.role).toBe('enthusiast');
    });

    it('sends a verification email after signup', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((dto) => dto);
      userRepo.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'uid-1' }));

      await service.signup({ email: 'a@a.com', password: 'pass' });

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@a.com' }),
      );
    });

    it('generates an emailVerificationToken on signup', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((dto) => dto);
      userRepo.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'uid-1' }));

      await service.signup({ email: 'a@a.com', password: 'pass' });

      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg.emailVerificationToken).toBeTruthy();
      expect(typeof createArg.emailVerificationToken).toBe('string');
    });
  });

  describe('login', () => {
    it('returns access token on valid credentials', async () => {
      const hash = await bcrypt.hash('correct', 12);
      userRepo.findOne.mockResolvedValue({
        id: 'uid-1',
        email: 'a@a.com',
        passwordHash: hash,
        role: 'mechanic',
        emailVerified: true,
      });

      const result = await service.login({ email: 'a@a.com', password: 'correct' });
      expect(result.accessToken).toBe('test-token');
      expect(result.userId).toBe('uid-1');
      expect(result.emailVerified).toBe(true);
    });

    it('throws UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hash = await bcrypt.hash('correct', 12);
      userRepo.findOne.mockResolvedValue({
        id: 'uid-1',
        email: 'a@a.com',
        passwordHash: hash,
        role: 'mechanic',
      });

      await expect(service.login({ email: 'a@a.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginWithFirebase', () => {
    it('creates a new user if none exists and returns token', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const newUser = { id: 'uid-2', email: 'g@g.com', provider: 'google', emailVerified: true };
      userRepo.create.mockReturnValue(newUser);
      userRepo.save.mockResolvedValue(newUser);

      const result = await service.loginWithFirebase('fb-uid', 'g@g.com', 'google');
      expect(result.accessToken).toBe('test-token');
      expect(result.userId).toBe('uid-2');
    });

    it('returns token for existing user without creating a duplicate', async () => {
      const existing = { id: 'uid-3', email: 'g@g.com', provider: 'google', emailVerified: true };
      userRepo.findOne.mockResolvedValue(existing);

      await service.loginWithFirebase('fb-uid', 'g@g.com', 'google');
      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const buildQb = (result: any) => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result),
    });

    it('sets emailVerified and clears token on valid token', async () => {
      const user = { id: 'uid-1', emailVerificationToken: 'valid-token' };
      userRepo.createQueryBuilder.mockReturnValue(buildQb(user));
      userRepo.update.mockResolvedValue({});

      const result = await service.verifyEmail('valid-token');

      expect(userRepo.update).toHaveBeenCalledWith('uid-1', {
        emailVerified: true,
        emailVerificationToken: null,
      });
      expect(result).toEqual({ verified: true });
    });

    it('throws BadRequestException on invalid token', async () => {
      userRepo.createQueryBuilder.mockReturnValue(buildQb(null));
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    it('throws NotFoundException when email not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.resendVerification('x@x.com')).rejects.toThrow(NotFoundException);
    });

    it('returns already verified message if already verified', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid-1', email: 'a@a.com', emailVerified: true });
      const result = await service.resendVerification('a@a.com');
      expect(result.message).toContain('already verified');
    });

    it('sends new verification email', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid-1', email: 'a@a.com', emailVerified: false });
      userRepo.update.mockResolvedValue({});

      await service.resendVerification('a@a.com');

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@a.com' }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('throws NotFoundException when email not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.forgotPassword('x@x.com')).rejects.toThrow(NotFoundException);
    });

    it('saves a reset token and sends email', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid-1', email: 'a@a.com' });
      userRepo.update.mockResolvedValue({});

      await service.forgotPassword('a@a.com');

      expect(userRepo.update).toHaveBeenCalledWith(
        'uid-1',
        expect.objectContaining({ passwordResetToken: expect.any(String) }),
      );
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@a.com' }),
      );
    });
  });

  describe('resetPassword', () => {
    const buildQb = (result: any) => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result),
    });

    it('throws BadRequestException on invalid token', async () => {
      userRepo.createQueryBuilder.mockReturnValue(buildQb(null));
      await expect(service.resetPassword('bad', 'newpass12')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on expired token', async () => {
      const expired = new Date(Date.now() - 1000);
      userRepo.createQueryBuilder.mockReturnValue(
        buildQb({ id: 'uid-1', passwordResetExpiry: expired }),
      );
      await expect(service.resetPassword('token', 'newpass12')).rejects.toThrow(BadRequestException);
    });

    it('updates password and clears token on valid token', async () => {
      const future = new Date(Date.now() + 60000);
      userRepo.createQueryBuilder.mockReturnValue(
        buildQb({ id: 'uid-1', passwordResetToken: 'token', passwordResetExpiry: future }),
      );
      userRepo.update.mockResolvedValue({});

      const result = await service.resetPassword('token', 'newpassword');

      expect(userRepo.update).toHaveBeenCalledWith(
        'uid-1',
        expect.objectContaining({
          passwordHash: expect.any(String),
          passwordResetToken: null,
          passwordResetExpiry: null,
        }),
      );
      expect(result.message).toBeTruthy();
    });
  });

  describe('changePassword', () => {
    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.changePassword('uid-1', 'old', 'new')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for social login accounts', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid-1', passwordHash: null, provider: 'google' });
      await expect(service.changePassword('uid-1', 'old', 'new')).rejects.toThrow(BadRequestException);
    });

    it('throws UnauthorizedException on wrong current password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      userRepo.findOne.mockResolvedValue({ id: 'uid-1', passwordHash: hash, provider: 'email' });
      await expect(service.changePassword('uid-1', 'wrong', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('updates password hash on valid current password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      userRepo.findOne.mockResolvedValue({ id: 'uid-1', passwordHash: hash, provider: 'email' });
      userRepo.update.mockResolvedValue({});

      const result = await service.changePassword('uid-1', 'correct', 'newpass12');

      expect(userRepo.update).toHaveBeenCalledWith(
        'uid-1',
        expect.objectContaining({ passwordHash: expect.any(String) }),
      );
      expect(result.message).toBeTruthy();
    });
  });

  describe('deleteAccount', () => {
    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteAccount('uid-x')).rejects.toThrow(NotFoundException);
    });

    it('deletes the user', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid-1' });
      userRepo.delete.mockResolvedValue({});

      const result = await service.deleteAccount('uid-1');

      expect(userRepo.delete).toHaveBeenCalledWith('uid-1');
      expect(result.message).toBeTruthy();
    });
  });
});

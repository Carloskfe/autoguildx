import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/auth/auth.service';
import { UserEntity } from '../../../src/auth/entities/user.entity';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('test-token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useFactory: mockUserRepo },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(UserEntity));
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
      expect(result).toEqual({ accessToken: 'test-token', userId: 'uid-1' });
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
  });

  describe('login', () => {
    it('returns access token on valid credentials', async () => {
      const hash = await bcrypt.hash('correct', 12);
      userRepo.findOne.mockResolvedValue({
        id: 'uid-1',
        email: 'a@a.com',
        passwordHash: hash,
        role: 'mechanic',
      });

      const result = await service.login({ email: 'a@a.com', password: 'correct' });
      expect(result).toEqual({ accessToken: 'test-token', userId: 'uid-1' });
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
      const newUser = { id: 'uid-2', email: 'g@g.com', provider: 'google' };
      userRepo.create.mockReturnValue(newUser);
      userRepo.save.mockResolvedValue(newUser);

      const result = await service.loginWithFirebase('fb-uid', 'g@g.com', 'google');
      expect(result).toEqual({ accessToken: 'test-token', userId: 'uid-2' });
    });

    it('returns token for existing user without creating a duplicate', async () => {
      const existing = { id: 'uid-3', email: 'g@g.com', provider: 'google' };
      userRepo.findOne.mockResolvedValue(existing);

      await service.loginWithFirebase('fb-uid', 'g@g.com', 'google');
      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });
});

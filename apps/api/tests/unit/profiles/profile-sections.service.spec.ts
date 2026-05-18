import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProfileSectionsService } from '../../../src/profiles/profile-sections.service';
import { ProfileSectionEntity } from '../../../src/profiles/entities/profile-section.entity';
import { ProfileEntity } from '../../../src/profiles/entities/profile.entity';

const mockSectionRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockProfileRepo = () => ({
  findOne: jest.fn(),
});

describe('ProfileSectionsService', () => {
  let service: ProfileSectionsService;
  let sectionRepo: ReturnType<typeof mockSectionRepo>;
  let profileRepo: ReturnType<typeof mockProfileRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileSectionsService,
        { provide: getRepositoryToken(ProfileSectionEntity), useFactory: mockSectionRepo },
        { provide: getRepositoryToken(ProfileEntity), useFactory: mockProfileRepo },
      ],
    }).compile();

    service = module.get(ProfileSectionsService);
    sectionRepo = module.get(getRepositoryToken(ProfileSectionEntity));
    profileRepo = module.get(getRepositoryToken(ProfileEntity));
  });

  describe('findByProfileId', () => {
    it('returns sections ordered by sortOrder', async () => {
      const sections = [{ id: '1' }, { id: '2' }];
      sectionRepo.find.mockResolvedValue(sections);
      const result = await service.findByProfileId('profile-1');
      expect(result).toBe(sections);
      expect(sectionRepo.find).toHaveBeenCalledWith({
        where: { profileId: 'profile-1' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('creates a section for the current user profile', async () => {
      const profile = { id: 'profile-1', userId: 'user-1' };
      const dto = { type: 'expertise' as const, data: { skill: 'Engine Rebuild', level: 'expert' }, sortOrder: 0 };
      const section = { id: 'sec-1', ...dto, profileId: profile.id };

      profileRepo.findOne.mockResolvedValue(profile);
      sectionRepo.create.mockReturnValue(section);
      sectionRepo.save.mockResolvedValue(section);

      const result = await service.create('user-1', dto);
      expect(result).toBe(section);
      expect(sectionRepo.create).toHaveBeenCalledWith({
        profileId: 'profile-1',
        type: 'expertise',
        data: dto.data,
        sortOrder: 0,
      });
    });

    it('throws NotFoundException if profile does not exist', async () => {
      profileRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create('user-x', { type: 'expertise', data: {}, sortOrder: 0 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a section the user owns', async () => {
      const profile = { id: 'profile-1', userId: 'user-1' };
      const section = { id: 'sec-1', profileId: 'profile-1', data: { skill: 'old' } };

      sectionRepo.findOne.mockResolvedValue(section);
      profileRepo.findOne.mockResolvedValue(profile);
      sectionRepo.save.mockResolvedValue({ ...section, data: { skill: 'new' } });

      const result = await service.update('user-1', 'sec-1', { data: { skill: 'new' } });
      expect(result.data).toEqual({ skill: 'new' });
    });

    it('throws NotFoundException if section not found', async () => {
      sectionRepo.findOne.mockResolvedValue(null);
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1' });
      await expect(service.update('user-1', 'missing', {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if section belongs to another profile', async () => {
      sectionRepo.findOne.mockResolvedValue({ id: 'sec-1', profileId: 'profile-other' });
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1' });
      await expect(service.update('user-1', 'sec-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('removes a section the user owns', async () => {
      const profile = { id: 'profile-1' };
      const section = { id: 'sec-1', profileId: 'profile-1' };

      sectionRepo.findOne.mockResolvedValue(section);
      profileRepo.findOne.mockResolvedValue(profile);
      sectionRepo.remove.mockResolvedValue(undefined);

      await service.remove('user-1', 'sec-1');
      expect(sectionRepo.remove).toHaveBeenCalledWith(section);
    });

    it('throws NotFoundException if section not found', async () => {
      sectionRepo.findOne.mockResolvedValue(null);
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1' });
      await expect(service.remove('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if section belongs to another profile', async () => {
      sectionRepo.findOne.mockResolvedValue({ id: 'sec-1', profileId: 'profile-other' });
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1' });
      await expect(service.remove('user-1', 'sec-1')).rejects.toThrow(ForbiddenException);
    });
  });
});

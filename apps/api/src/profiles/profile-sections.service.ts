import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileSectionEntity } from './entities/profile-section.entity';
import { ProfileEntity } from './entities/profile.entity';
import { CreateProfileSectionDto } from './dto/create-profile-section.dto';
import { UpdateProfileSectionDto } from './dto/update-profile-section.dto';

@Injectable()
export class ProfileSectionsService {
  constructor(
    @InjectRepository(ProfileSectionEntity)
    private readonly repo: Repository<ProfileSectionEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) {}

  findByProfileId(profileId: string): Promise<ProfileSectionEntity[]> {
    return this.repo.find({
      where: { profileId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async create(userId: string, dto: CreateProfileSectionDto): Promise<ProfileSectionEntity> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    const section = this.repo.create({
      profileId: profile.id,
      type: dto.type,
      data: dto.data,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.repo.save(section);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProfileSectionDto,
  ): Promise<ProfileSectionEntity> {
    const [section, profile] = await Promise.all([
      this.repo.findOne({ where: { id } }),
      this.profileRepo.findOne({ where: { userId } }),
    ]);
    if (!section) throw new NotFoundException('Section not found');
    if (!profile || section.profileId !== profile.id) throw new ForbiddenException();
    Object.assign(section, dto);
    return this.repo.save(section);
  }

  async remove(userId: string, id: string): Promise<void> {
    const [section, profile] = await Promise.all([
      this.repo.findOne({ where: { id } }),
      this.profileRepo.findOne({ where: { userId } }),
    ]);
    if (!section) throw new NotFoundException('Section not found');
    if (!profile || section.profileId !== profile.id) throw new ForbiddenException();
    await this.repo.remove(section);
  }
}

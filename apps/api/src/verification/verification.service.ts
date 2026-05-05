import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRequestEntity } from './entities/verification-request.entity';
import { ProfileEntity } from '../profiles/entities/profile.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequestEntity)
    private requestRepo: Repository<VerificationRequestEntity>,
    @InjectRepository(ProfileEntity)
    private profileRepo: Repository<ProfileEntity>,
    private notificationsService: NotificationsService,
  ) {}

  async requestVerification(userId: string, profileId: string): Promise<VerificationRequestEntity> {
    const existing = await this.requestRepo.findOne({
      where: { userId, status: 'pending' },
    });
    if (existing) {
      throw new ConflictException('A verification request is already pending');
    }

    const req = this.requestRepo.create({ userId, profileId, status: 'pending' });
    return this.requestRepo.save(req);
  }

  async getPendingRequests(): Promise<VerificationRequestEntity[]> {
    return this.requestRepo.find({
      where: { status: 'pending' },
      relations: ['profile', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  async reviewRequest(
    requestId: string,
    action: 'approve' | 'deny',
    adminId: string,
    note?: string,
  ): Promise<VerificationRequestEntity> {
    const req = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Verification request not found');

    req.status = action === 'approve' ? 'approved' : 'denied';
    if (note) req.note = note;

    if (action === 'approve') {
      await this.profileRepo.update({ id: req.profileId }, { isVerified: true });
    }

    const saved = await this.requestRepo.save(req);

    await this.notificationsService.create({
      userId: req.userId,
      actorId: adminId,
      type: action === 'approve' ? 'verification_approved' : 'verification_denied',
      targetId: req.id,
      targetType: 'verification_request',
    });

    return saved;
  }

  async getMyRequestStatus(userId: string): Promise<{ status: string } | null> {
    const req = await this.requestRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!req) return null;
    return { status: req.status };
  }
}

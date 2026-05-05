import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationRequestEntity } from './entities/verification-request.entity';
import { ProfileEntity } from '../profiles/entities/profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationRequestEntity, ProfileEntity]),
    NotificationsModule,
  ],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}

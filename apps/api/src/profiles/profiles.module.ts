import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { ProfileSectionsService } from './profile-sections.service';
import { ProfileSectionsController } from './profile-sections.controller';
import { ProfileEntity } from './entities/profile.entity';
import { ProfileSectionEntity } from './entities/profile-section.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity, ProfileSectionEntity]), NotificationsModule],
  providers: [ProfilesService, ProfileSectionsService],
  controllers: [ProfilesController, ProfileSectionsController],
  exports: [ProfilesService, ProfileSectionsService],
})
export class ProfilesModule {}

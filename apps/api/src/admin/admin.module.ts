import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../profiles/entities/profile.entity';
import { ListingEntity } from '../listings/entities/listing.entity';
import { EventEntity } from '../events/entities/event.entity';
import { PostEntity } from '../posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProfileEntity, ListingEntity, EventEntity, PostEntity]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}

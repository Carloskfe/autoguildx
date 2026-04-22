import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ProfileEntity } from '../profiles/entities/profile.entity';
import { ListingEntity } from '../listings/entities/listing.entity';
import { EventEntity } from '../events/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity, ListingEntity, EventEntity])],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}

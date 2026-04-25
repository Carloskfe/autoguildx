import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './auth/entities/user.entity';
import { ProfileEntity } from './profiles/entities/profile.entity';
import { PostEntity } from './posts/entities/post.entity';
import { CommentEntity } from './posts/entities/comment.entity';
import { ListingEntity } from './listings/entities/listing.entity';
import { EventEntity } from './events/entities/event.entity';
import { SubscriptionEntity } from './subscriptions/entities/subscription.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    UserEntity,
    ProfileEntity,
    PostEntity,
    CommentEntity,
    ListingEntity,
    EventEntity,
    SubscriptionEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

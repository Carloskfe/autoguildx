import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PostsModule } from './posts/posts.module';
import { ListingsModule } from './listings/listings.module';
import { EventsModule } from './events/events.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { MessagesModule } from './messages/messages.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ForumsModule } from './forums/forums.module';
import { FirebaseModule } from './firebase/firebase.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          url: config.get('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: !isProd,
          migrations: isProd ? [path.join(__dirname, 'migrations/*.js')] : [],
          migrationsRun: isProd,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    FirebaseModule,
    AuthModule,
    ProfilesModule,
    PostsModule,
    ListingsModule,
    EventsModule,
    SubscriptionsModule,
    SearchModule,
    HealthModule,
    UploadModule,
    MessagesModule,
    ReviewsModule,
    NotificationsModule,
    ForumsModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PostEntity } from './entities/post.entity';
import { CommentEntity } from './entities/comment.entity';
import { CommentReactionEntity } from './entities/comment-reaction.entity';
import { PostReactionEntity } from './entities/post-reaction.entity';
import { ForumPostEntity } from '../forums/entities/forum-post.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      CommentEntity,
      CommentReactionEntity,
      PostReactionEntity,
      ForumPostEntity,
    ]),
    ProfilesModule,
    NotificationsModule,
  ],
  providers: [PostsService, CommentsService],
  controllers: [PostsController, CommentsController],
  exports: [PostsService, CommentsService],
})
export class PostsModule {}

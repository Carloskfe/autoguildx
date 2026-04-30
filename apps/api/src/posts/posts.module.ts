import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PostEntity } from './entities/post.entity';
import { CommentEntity } from './entities/comment.entity';
import { PostReactionEntity } from './entities/post-reaction.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, CommentEntity, PostReactionEntity]),
    ProfilesModule,
  ],
  providers: [PostsService, CommentsService],
  controllers: [PostsController, CommentsController],
  exports: [PostsService],
})
export class PostsModule {}

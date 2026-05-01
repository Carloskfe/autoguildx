import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumEntity } from './entities/forum.entity';
import { ForumMemberEntity } from './entities/forum-member.entity';
import { ForumPostEntity } from './entities/forum-post.entity';
import { ForumVoteEntity } from './entities/forum-vote.entity';
import { ForumCommentVoteEntity } from './entities/forum-comment-vote.entity';
import { CommentEntity } from '../posts/entities/comment.entity';
import { ForumsService } from './forums.service';
import { ForumsController, CommentsVoteController } from './forums.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ForumEntity,
      ForumMemberEntity,
      ForumPostEntity,
      ForumVoteEntity,
      ForumCommentVoteEntity,
      CommentEntity,
    ]),
    PostsModule,
  ],
  providers: [ForumsService],
  controllers: [ForumsController, CommentsVoteController],
  exports: [ForumsService],
})
export class ForumsModule {}

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './auth/entities/user.entity';
import { ProfileEntity } from './profiles/entities/profile.entity';
import { PostEntity } from './posts/entities/post.entity';
import { CommentEntity } from './posts/entities/comment.entity';
import { ListingEntity } from './listings/entities/listing.entity';
import { EventEntity } from './events/entities/event.entity';
import { SubscriptionEntity } from './subscriptions/entities/subscription.entity';
import { CommentReactionEntity } from './posts/entities/comment-reaction.entity';
import { ForumEntity } from './forums/entities/forum.entity';
import { ForumMemberEntity } from './forums/entities/forum-member.entity';
import { ForumPostEntity } from './forums/entities/forum-post.entity';
import { ForumVoteEntity } from './forums/entities/forum-vote.entity';
import { ForumCommentVoteEntity } from './forums/entities/forum-comment-vote.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    UserEntity,
    ProfileEntity,
    PostEntity,
    CommentEntity,
    CommentReactionEntity,
    ListingEntity,
    EventEntity,
    SubscriptionEntity,
    ForumEntity,
    ForumMemberEntity,
    ForumPostEntity,
    ForumVoteEntity,
    ForumCommentVoteEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

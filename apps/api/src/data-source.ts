import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './auth/entities/user.entity';
import { ProfileEntity } from './profiles/entities/profile.entity';
import { PostEntity } from './posts/entities/post.entity';
import { CommentEntity } from './posts/entities/comment.entity';
import { CommentReactionEntity } from './posts/entities/comment-reaction.entity';
import { PostReactionEntity } from './posts/entities/post-reaction.entity';
import { ListingEntity } from './listings/entities/listing.entity';
import { EventEntity } from './events/entities/event.entity';
import { SubscriptionEntity } from './subscriptions/entities/subscription.entity';
import { ReviewEntity } from './reviews/entities/review.entity';
import { ConversationEntity } from './messages/entities/conversation.entity';
import { MessageEntity } from './messages/entities/message.entity';
import { NotificationEntity } from './notifications/entities/notification.entity';
import { VerificationRequestEntity } from './verification/entities/verification-request.entity';
import { ForumEntity } from './forums/entities/forum.entity';
import { ForumMemberEntity } from './forums/entities/forum-member.entity';
import { ForumPostEntity } from './forums/entities/forum-post.entity';
import { ForumVoteEntity } from './forums/entities/forum-vote.entity';
import { ForumCommentVoteEntity } from './forums/entities/forum-comment-vote.entity';
import { CourseEntity } from './courses/entities/course.entity';
import { LessonEntity } from './courses/entities/lesson.entity';
import { EnrollmentEntity } from './courses/entities/enrollment.entity';
import { LessonProgressEntity } from './courses/entities/lesson-progress.entity';
import { CertificateEntity } from './courses/entities/certificate.entity';

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
    PostReactionEntity,
    ListingEntity,
    EventEntity,
    SubscriptionEntity,
    ReviewEntity,
    ConversationEntity,
    MessageEntity,
    NotificationEntity,
    VerificationRequestEntity,
    ForumEntity,
    ForumMemberEntity,
    ForumPostEntity,
    ForumVoteEntity,
    ForumCommentVoteEntity,
    CourseEntity,
    LessonEntity,
    EnrollmentEntity,
    LessonProgressEntity,
    CertificateEntity,
  ],
  migrations: [__dirname + '/migrations/*.ts', __dirname + '/migrations/*.js'],
  synchronize: false,
});

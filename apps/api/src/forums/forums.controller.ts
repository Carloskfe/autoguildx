import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ForumsService } from './forums.service';
import { CommentsService } from '../posts/comments.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { VoteDto } from './dto/vote.dto';
import { ReactCommentDto } from './dto/react-comment.dto';
import { CreateCommentDto } from '../posts/dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('forums')
@Controller('forums')
export class ForumsController {
  constructor(
    private readonly forumsService: ForumsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a forum' })
  create(@CurrentUser() user, @Body() dto: CreateForumDto) {
    return this.forumsService.createForum(user.id, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List forums' })
  @ApiQuery({ name: 'category', required: false })
  list(@Query('category') category: string, @CurrentUser() user) {
    return this.forumsService.listForums(category, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get forum detail' })
  getOne(@Param('slug') slug: string, @CurrentUser() user) {
    return this.forumsService.getForumBySlug(slug, user?.id);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a forum (creator only)' })
  update(@Param('slug') slug: string, @CurrentUser() user, @Body() dto: UpdateForumDto) {
    return this.forumsService.updateForum(slug, user.id, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a forum (creator only)' })
  remove(@Param('slug') slug: string, @CurrentUser() user) {
    return this.forumsService.deleteForum(slug, user.id);
  }

  @Post(':slug/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a forum' })
  join(@Param('slug') slug: string, @CurrentUser() user) {
    return this.forumsService.joinForum(slug, user.id);
  }

  @Delete(':slug/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a forum' })
  leave(@Param('slug') slug: string, @CurrentUser() user) {
    return this.forumsService.leaveForum(slug, user.id);
  }

  @Post(':slug/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a forum post' })
  createPost(@Param('slug') slug: string, @CurrentUser() user, @Body() dto: CreateForumPostDto) {
    return this.forumsService.createPost(slug, user.id, dto);
  }

  @Get(':slug/posts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List forum posts' })
  @ApiQuery({ name: 'sort', required: false, enum: ['hot', 'top', 'new'] })
  @ApiQuery({ name: 'page', required: false })
  listPosts(
    @Param('slug') slug: string,
    @Query('sort') sort: 'hot' | 'top' | 'new',
    @Query('page') page: number,
    @CurrentUser() user,
  ) {
    return this.forumsService.listPosts(slug, sort ?? 'hot', page ?? 1, user?.id);
  }

  @Get(':slug/posts/:postId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a forum post' })
  getPost(@Param('slug') slug: string, @Param('postId') postId: string, @CurrentUser() user) {
    return this.forumsService.getPost(slug, postId, user?.id);
  }

  @Delete(':slug/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a forum post (author only)' })
  deletePost(@Param('slug') slug: string, @Param('postId') postId: string, @CurrentUser() user) {
    return this.forumsService.deletePost(slug, postId, user.id);
  }

  @Post(':slug/posts/:postId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a forum post' })
  voteOnPost(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user,
    @Body() dto: VoteDto,
  ) {
    return this.forumsService.voteOnPost(slug, postId, user.id, dto.value);
  }

  @Delete(':slug/posts/:postId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove vote from a forum post' })
  removeVoteOnPost(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user,
  ) {
    return this.forumsService.removeVoteOnPost(slug, postId, user.id);
  }

  @Post(':slug/posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comment on a forum post' })
  createComment(
    @Param('postId') postId: string,
    @CurrentUser() user,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(null, user.id, dto, postId);
  }

  @Get(':slug/posts/:postId/comments')
  @ApiOperation({ summary: 'Get nested comments for a forum post' })
  getComments(@Param('postId') postId: string) {
    return this.commentsService.findByForumPost(postId);
  }

  @Post(':slug/posts/:postId/comments/:commentId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'React to a forum comment' })
  reactComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user,
    @Body() dto: ReactCommentDto,
  ) {
    return this.commentsService.reactToComment(commentId, user.id, dto.emoji);
  }

  @Delete(':slug/posts/:postId/comments/:commentId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove reaction from a forum comment' })
  unreactComment(@Param('commentId') commentId: string, @CurrentUser() user) {
    return this.commentsService.unreactToComment(commentId, user.id);
  }
}

@ApiTags('comments')
@Controller('comments')
export class CommentsVoteController {
  constructor(
    private readonly forumsService: ForumsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post(':commentId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a comment' })
  vote(@Param('commentId') commentId: string, @CurrentUser() user, @Body() dto: VoteDto) {
    return this.forumsService.voteOnComment(commentId, user.id, dto.value);
  }

  @Delete(':commentId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove vote from a comment' })
  removeVote(@Param('commentId') commentId: string, @CurrentUser() user) {
    return this.forumsService.removeVoteOnComment(commentId, user.id);
  }

  @Post(':commentId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'React to a comment (generic endpoint)' })
  react(
    @Param('commentId') commentId: string,
    @CurrentUser() user,
    @Body() dto: ReactCommentDto,
  ) {
    return this.commentsService.reactToComment(commentId, user.id, dto.emoji);
  }

  @Delete(':commentId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove reaction from a comment (generic endpoint)' })
  unreact(@Param('commentId') commentId: string, @CurrentUser() user) {
    return this.commentsService.unreactToComment(commentId, user.id);
  }
}

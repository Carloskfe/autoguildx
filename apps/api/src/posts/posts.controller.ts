import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProfilesService } from '../profiles/profiles.service';

@ApiTags('posts')
@Controller()
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post' })
  create(@CurrentUser() user, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get social feed — scoped to followed users when authenticated' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(@CurrentUser() user, @Query('page') page: number, @Query('limit') limit: number) {
    const followingIds = user ? await this.profilesService.getFollowingUserIds(user.id) : undefined;
    return this.postsService.getFeed(followingIds, page, limit);
  }

  @Get('users/:userId/posts')
  @ApiOperation({ summary: 'Get posts by user' })
  getUserPosts(@Param('userId') userId: string, @Query('page') page: number) {
    return this.postsService.getUserPosts(userId, page);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  like(@Param('id') id: string) {
    return this.postsService.like(id);
  }

  @Post('posts/:id/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'React to a post (fire | love | respect | wild | like)' })
  react(@Param('id') id: string, @CurrentUser() user, @Body('emoji') emoji: string) {
    return this.postsService.react(id, user.id, emoji);
  }

  @Delete('posts/:id/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove reaction from a post' })
  unreact(@Param('id') id: string, @CurrentUser() user) {
    return this.postsService.unreact(id, user.id);
  }

  @Get('posts/:id/reactions')
  @ApiOperation({ summary: 'Get reaction counts for a post' })
  getReactions(@Param('id') id: string) {
    return this.postsService.getReactions(id);
  }

  @Get('posts/:id/my-reaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reaction on a post' })
  getMyReaction(@Param('id') id: string, @CurrentUser() user) {
    return this.postsService.getUserReaction(id, user.id);
  }

  @Post('posts/:id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share (repost) a post, optionally with a comment' })
  share(@Param('id') id: string, @CurrentUser() user, @Body('content') content?: string) {
    return this.postsService.share(id, user.id, content);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  delete(@Param('id') id: string, @CurrentUser() user) {
    return this.postsService.delete(id, user.id);
  }
}

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
  async getFeed(
    @CurrentUser() user,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const followingIds = user
      ? await this.profilesService.getFollowingUserIds(user.id)
      : undefined;
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

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  delete(@Param('id') id: string, @CurrentUser() user) {
    return this.postsService.delete(id, user.id);
  }
}

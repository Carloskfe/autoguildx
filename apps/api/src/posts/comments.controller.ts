import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactCommentDto } from '../forums/dto/react-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('comments')
@Controller('posts')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment (or reply) to a post' })
  create(@Param('id') id: string, @CurrentUser() user, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(id, user.id, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get nested comment tree for a post' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findByPost(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.commentsService.findByPost(id, page, limit);
  }

  @Post(':id/comments/:commentId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'React to a comment' })
  reactToComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user,
    @Body() dto: ReactCommentDto,
  ) {
    return this.commentsService.reactToComment(commentId, user.id, dto.emoji);
  }

  @Delete(':id/comments/:commentId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove reaction from a comment' })
  unreactToComment(@Param('commentId') commentId: string, @CurrentUser() user) {
    return this.commentsService.unreactToComment(commentId, user.id);
  }

  @Get(':id/comments/:commentId/reactions')
  @ApiOperation({ summary: 'Get reaction counts for a comment' })
  getCommentReactions(@Param('commentId') commentId: string) {
    return this.commentsService.getCommentReactions(commentId);
  }

  @Get(':id/comments/:commentId/my-reaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reaction on a comment' })
  getMyCommentReaction(@Param('commentId') commentId: string, @CurrentUser() user) {
    return this.commentsService.getMyCommentReaction(commentId, user.id);
  }
}

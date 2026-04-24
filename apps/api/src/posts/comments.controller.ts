import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('comments')
@Controller('posts')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  create(@Param('id') id: string, @CurrentUser() user, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(id, user.id, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findByPost(@Param('id') id: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.commentsService.findByPost(id, page, limit);
  }
}

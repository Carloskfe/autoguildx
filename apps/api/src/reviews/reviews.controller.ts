import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update a review (upsert)' })
  upsert(@CurrentUser() user, @Body() dto: CreateReviewDto) {
    return this.reviewsService.upsert(user.id, dto);
  }

  @Get(':targetType/:targetId')
  @ApiOperation({ summary: 'Get paginated reviews for a profile, listing, or event' })
  getForTarget(
    @Param('targetId') targetId: string,
    @Param('targetType') targetType: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getForTarget(targetId, targetType, page, limit);
  }

  @Get(':targetType/:targetId/summary')
  @ApiOperation({ summary: 'Get average rating and total count for a target' })
  getSummary(@Param('targetId') targetId: string, @Param('targetType') targetType: string) {
    return this.reviewsService.getSummary(targetId, targetType);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete own review' })
  deleteReview(@Param('id') id: string, @CurrentUser() user) {
    return this.reviewsService.deleteReview(id, user.id);
  }
}

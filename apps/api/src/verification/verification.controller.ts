import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('verification')
@ApiBearerAuth()
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestVerification(
    @CurrentUser() user: { id: string },
    @Body() dto: RequestVerificationDto,
  ) {
    return this.verificationService.requestVerification(user.id, user.id);
  }

  @Get('my-status')
  @UseGuards(JwtAuthGuard)
  async getMyStatus(@CurrentUser() user: { id: string }) {
    const result = await this.verificationService.getMyRequestStatus(user.id);
    return result ?? { status: 'none' };
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getPending() {
    return this.verificationService.getPendingRequests();
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.verificationService.reviewRequest(id, dto.action, user.id, dto.note);
  }
}

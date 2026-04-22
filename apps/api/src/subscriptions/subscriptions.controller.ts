import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current subscription tier' })
  getCurrent(@CurrentUser() user) {
    return this.subscriptionsService.getCurrent(user.id);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription tier' })
  upgrade(@CurrentUser() user, @Body('tier') tier: 'owner' | 'company') {
    return this.subscriptionsService.upgrade(user.id, tier);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@CurrentUser() user) {
    return this.subscriptionsService.cancel(user.id);
  }
}

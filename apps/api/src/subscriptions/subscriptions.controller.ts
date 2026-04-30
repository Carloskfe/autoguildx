import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription tier' })
  getCurrent(@CurrentUser() user) {
    return this.subscriptionsService.getCurrent(user.id);
  }

  @Post('upgrade')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upgrade subscription tier (legacy — no payment)' })
  upgrade(@CurrentUser() user, @Body('tier') tier: 'owner' | 'company') {
    return this.subscriptionsService.upgrade(user.id, tier);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@CurrentUser() user) {
    return this.subscriptionsService.cancel(user.id);
  }

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe Checkout session and return the redirect URL' })
  createCheckoutSession(@CurrentUser() user, @Body('tier') tier: 'owner' | 'company') {
    return this.subscriptionsService.createCheckoutSession(user.id, tier);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook receiver (called by Stripe, not users)' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionsService.handleWebhook(req.rawBody, sig);
  }
}

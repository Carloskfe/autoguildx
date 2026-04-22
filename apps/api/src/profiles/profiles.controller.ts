import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create profile for authenticated user' })
  create(@CurrentUser() user, @Body() dto: any) {
    return this.profilesService.create(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMe(@CurrentUser() user) {
    return this.profilesService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  findOne(@Param('id') id: string) {
    return this.profilesService.findById(id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@CurrentUser() user, @Body() dto: any) {
    return this.profilesService.update(user.id, dto);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  follow(@CurrentUser() user, @Param('id') id: string) {
    return this.profilesService.follow(user.id, id);
  }

  @Post(':id/unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unfollow(@CurrentUser() user, @Param('id') id: string) {
    return this.profilesService.unfollow(user.id, id);
  }
}

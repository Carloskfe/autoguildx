import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileSectionsService } from './profile-sections.service';
import { CreateProfileSectionDto } from './dto/create-profile-section.dto';
import { UpdateProfileSectionDto } from './dto/update-profile-section.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('profile-sections')
@Controller('profiles')
export class ProfileSectionsController {
  constructor(private readonly service: ProfileSectionsService) {}

  @Get(':profileId/sections')
  @ApiOperation({ summary: 'List sections for a profile (public)' })
  findAll(@Param('profileId') profileId: string) {
    return this.service.findByProfileId(profileId);
  }

  @Post('sections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a section to the current user's profile" })
  create(@CurrentUser() user, @Body() dto: CreateProfileSectionDto) {
    return this.service.create(user.id, dto);
  }

  @Patch('sections/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a profile section (owner only)' })
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateProfileSectionDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a profile section (owner only)' })
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}

import { Controller, Delete, Get, HttpCode, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SetRoleDto } from './dto/set-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getUsers(Number(page), Number(limit));
  }

  @Patch('users/:id/role')
  setUserRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.adminService.setUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @HttpCode(204)
  deleteUser(@Param('id') id: string, @CurrentUser() admin: { id: string }) {
    return this.adminService.deleteUser(id, admin.id);
  }
}

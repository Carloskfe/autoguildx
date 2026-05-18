import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  Req,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoursesService, CourseSort } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}

  // ── Course CRUD ──────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List published courses' })
  findAll(
    @CurrentUser() user,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: CourseSort,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.svc.findAll({ search, tag, sort, page, limit });
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook for course payments (called by Stripe)' })
  handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    return this.svc.handleCourseWebhook(req.rawBody!, sig);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a course' })
  create(@CurrentUser() user, @Body() dto: CreateCourseDto) {
    return this.svc.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Courses created by the current user' })
  findMy(@CurrentUser() user) {
    return this.svc.findMyCourses(user.id);
  }

  @Get('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My earned certificates' })
  getMyCertificates(@CurrentUser() user) {
    return this.svc.getMyCertificates(user.id);
  }

  @Get('enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My course enrollments' })
  getMyEnrollments(@CurrentUser() user) {
    return this.svc.getMyEnrollments(user.id);
  }

  @Get('my-progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Progress percentage for all enrolled courses' })
  getAllProgress(@CurrentUser() user) {
    return this.svc.getAllProgress(user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Course detail with lessons' })
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.findById(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course' })
  update(@Param('id') id: string, @CurrentUser() user, @Body() dto: Partial<CreateCourseDto>) {
    return this.svc.update(id, user.id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle course published state' })
  togglePublish(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.togglePublish(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.remove(id, user.id);
  }

  // ── Lessons ──────────────────────────────────────────────────────────────────

  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a lesson to a course' })
  addLesson(@Param('id') id: string, @CurrentUser() user, @Body() dto: CreateLessonDto) {
    return this.svc.addLesson(id, user.id, dto);
  }

  @Patch(':id/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson' })
  updateLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user,
    @Body() dto: Partial<CreateLessonDto>,
  ) {
    return this.svc.updateLesson(id, lessonId, user.id, dto);
  }

  @Delete(':id/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lesson' })
  removeLesson(@Param('id') id: string, @Param('lessonId') lessonId: string, @CurrentUser() user) {
    return this.svc.removeLesson(id, lessonId, user.id);
  }

  // ── Enrollment & Progress ────────────────────────────────────────────────────

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a free course' })
  enroll(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.enroll(user.id, id);
  }

  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout session for a paid course' })
  createCheckout(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.createCheckoutSession(user.id, id);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get progress for enrolled course' })
  getProgress(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.getProgress(user.id, id);
  }

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a lesson as complete' })
  completeLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user,
  ) {
    return this.svc.completeLesson(user.id, id, lessonId);
  }

  @Get(':id/certificate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate for a completed course' })
  getCertificate(@Param('id') id: string, @CurrentUser() user) {
    return this.svc.getCertificate(user.id, id);
  }
}

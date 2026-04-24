import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { PresignDto } from './dto/presign.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get a pre-signed URL for direct browser upload to S3' })
  presign(@Body() dto: PresignDto) {
    return this.uploadService.presign(dto.filename, dto.contentType);
  }
}

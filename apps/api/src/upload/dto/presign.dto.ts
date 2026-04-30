import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
] as const;

export class PresignDto {
  @ApiProperty({ example: 'photo.jpg' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'image/jpeg', enum: ALLOWED })
  @IsIn(ALLOWED)
  contentType: string;
}

import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignDto {
  @ApiProperty({ example: 'avatar.jpg' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType: string;
}

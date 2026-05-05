import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewRequestDto {
  @ApiProperty({ enum: ['approve', 'deny'] })
  @IsIn(['approve', 'deny'])
  action: 'approve' | 'deny';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

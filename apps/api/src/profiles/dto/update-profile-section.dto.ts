import { IsObject, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileSectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

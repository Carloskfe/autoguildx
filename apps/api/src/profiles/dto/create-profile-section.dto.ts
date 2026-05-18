import { IsIn, IsObject, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProfileSectionType } from '../entities/profile-section.entity';

const TYPES: ProfileSectionType[] = [
  'expertise',
  'experience',
  'build',
  'certification',
  'equipment',
];

export class CreateProfileSectionDto {
  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type: ProfileSectionType;

  @ApiProperty()
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

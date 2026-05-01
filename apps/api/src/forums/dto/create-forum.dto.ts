import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateForumDto {
  @ApiProperty() @IsString() @MaxLength(100) name: string;
  @ApiProperty() @IsString() @Matches(/^[a-z0-9-]+$/) slug: string;
  @ApiProperty() @IsString() @MaxLength(2000) description: string;
  @ApiProperty() @IsString() category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) rules?: string;
}

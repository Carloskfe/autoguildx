import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateForumPostDto {
  @ApiProperty() @IsString() @MaxLength(300) title: string;
  @ApiProperty() @IsString() @MaxLength(10000) content: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];
}

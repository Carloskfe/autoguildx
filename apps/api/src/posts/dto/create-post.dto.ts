import { IsString, IsOptional, IsArray, IsUrl, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty() @IsString() @MaxLength(2000) content: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];

  @ApiProperty({ enum: ['public', 'followers', 'private'], required: false })
  @IsOptional()
  @IsIn(['public', 'followers', 'private'])
  visibility?: string;

  @ApiProperty({ enum: ['single', 'multi', 'carousel'], required: false })
  @IsOptional()
  @IsIn(['single', 'multi', 'carousel'])
  mediaMode?: string;

  @ApiProperty({ enum: ['listing', 'event'], required: false })
  @IsOptional()
  @IsIn(['listing', 'event'])
  sharedContentType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sharedContentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sharedContent?: string;
}

import { IsString, IsOptional, IsIn, IsArray, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty({ enum: ['part', 'service'] }) @IsIn(['part', 'service']) type: string;
  @ApiProperty() @IsString() @MaxLength(150) title: string;
  @ApiProperty() @IsString() @MaxLength(3000) description: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
  @ApiProperty() @IsString() category: string;
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicleTags?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() location?: string;
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}

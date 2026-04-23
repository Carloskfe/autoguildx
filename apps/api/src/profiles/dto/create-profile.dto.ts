import { IsString, IsOptional, IsIn, IsArray, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() businessName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() location?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @ApiProperty({ enum: ['individual', 'business'], default: 'individual' })
  @IsOptional()
  @IsIn(['individual', 'business'])
  roleType?: string;
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() profileImageUrl?: string;
}

import { IsString, IsOptional, IsIn, IsArray, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty() @IsString() @MaxLength(150) title: string;
  @ApiProperty() @IsString() @MaxLength(3000) description: string;
  @ApiProperty({ enum: ['meetup', 'workshop', 'show', 'race', 'other'], default: 'other' })
  @IsOptional()
  @IsIn(['meetup', 'workshop', 'show', 'race', 'other'])
  type?: string;
  @ApiProperty() @IsString() location: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endDate?: string;
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}

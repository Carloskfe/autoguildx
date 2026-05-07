import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @ApiProperty({ required: false, enum: ['active', 'sold', 'draft'] })
  @IsOptional()
  @IsIn(['active', 'sold', 'draft'])
  status?: string;
}

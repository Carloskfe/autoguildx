import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty() @IsString() @MaxLength(1000) content: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
}

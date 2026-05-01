import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const VALID_EMOJIS = ['fire', 'love', 'respect', 'wild', 'like'] as const;

export class ReactCommentDto {
  @ApiProperty({ enum: VALID_EMOJIS }) @IsIn(VALID_EMOJIS) emoji: string;
}

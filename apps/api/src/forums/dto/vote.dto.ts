import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoteDto {
  @ApiProperty({ enum: [-1, 1] }) @IsIn([-1, 1]) value: -1 | 1;
}

import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartConversationDto {
  @ApiProperty()
  @IsUUID()
  recipientId: string;
}

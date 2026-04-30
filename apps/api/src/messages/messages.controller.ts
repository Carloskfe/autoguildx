import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread message count for the current user' })
  getUnreadCount(@CurrentUser() user) {
    return this.messagesService.getUnreadCount(user.id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for the current user' })
  getConversations(@CurrentUser() user) {
    return this.messagesService.getConversations(user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start or retrieve a conversation with a user' })
  getOrCreateConversation(@CurrentUser() user, @Body() dto: StartConversationDto) {
    return this.messagesService.getOrCreateConversation(user.id, dto.recipientId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get messages in a conversation (marks incoming as read)' })
  getMessages(
    @CurrentUser() user,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.getMessages(id, user.id, page, limit);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(@CurrentUser() user, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(id, user.id, dto.content);
  }
}

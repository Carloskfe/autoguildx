import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(ConversationEntity)
    private convRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private msgRepo: Repository<MessageEntity>,
  ) {}

  async getOrCreateConversation(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    const existing = await this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participantA', 'a')
      .leftJoinAndSelect('a.profile', 'ap')
      .leftJoinAndSelect('c.participantB', 'b')
      .leftJoinAndSelect('b.profile', 'bp')
      .where(
        '(c.participantAId = :u AND c.participantBId = :r) OR (c.participantAId = :r AND c.participantBId = :u)',
        { u: userId, r: recipientId },
      )
      .getOne();

    if (existing) return existing;

    const conv = this.convRepo.create({ participantAId: userId, participantBId: recipientId });
    const saved = await this.convRepo.save(conv);
    return this.convRepo.findOne({
      where: { id: saved.id },
      relations: ['participantA', 'participantA.profile', 'participantB', 'participantB.profile'],
    });
  }

  async getConversations(userId: string) {
    const convs = await this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participantA', 'a')
      .leftJoinAndSelect('a.profile', 'ap')
      .leftJoinAndSelect('c.participantB', 'b')
      .leftJoinAndSelect('b.profile', 'bp')
      .where('c.participantAId = :u OR c.participantBId = :u', { u: userId })
      .orderBy('c.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('c.createdAt', 'DESC')
      .getMany();

    return Promise.all(
      convs.map(async (conv) => {
        const lastMessage = await this.msgRepo.findOne({
          where: { conversationId: conv.id },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.msgRepo.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: this.otherParticipantId(conv, userId),
          },
        });

        return { ...conv, lastMessage: lastMessage ?? null, unreadCount };
      }),
    );
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participantAId !== userId && conv.participantBId !== userId) {
      throw new ForbiddenException();
    }

    const p = Number.isFinite(page) ? page : 1;
    const l = Number.isFinite(limit) ? limit : 50;

    const messages = await this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      skip: (p - 1) * l,
      take: l,
      relations: ['sender', 'sender.profile'],
    });

    // Mark incoming messages as read
    const unread = messages.filter((m) => m.senderId !== userId && !m.isRead);
    if (unread.length) {
      await this.msgRepo.save(unread.map((m) => ({ ...m, isRead: true })));
    }

    return messages;
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participantAId !== senderId && conv.participantBId !== senderId) {
      throw new ForbiddenException();
    }

    const msg = this.msgRepo.create({ conversationId, senderId, content });
    const saved = await this.msgRepo.save(msg);

    conv.lastMessageAt = saved.createdAt;
    await this.convRepo.save(conv);

    return this.msgRepo.findOne({
      where: { id: saved.id },
      relations: ['sender', 'sender.profile'],
    });
  }

  async getUnreadCount(userId: string) {
    const convs = await this.convRepo
      .createQueryBuilder('c')
      .select('c.id')
      .where('c.participantAId = :u OR c.participantBId = :u', { u: userId })
      .getMany();

    if (!convs.length) return { count: 0 };

    const convIds = convs.map((c) => c.id);
    const count = await this.msgRepo
      .createQueryBuilder('m')
      .where('m.conversationId IN (:...ids)', { ids: convIds })
      .andWhere('m.senderId != :u', { u: userId })
      .andWhere('m.isRead = false')
      .getCount();

    return { count };
  }

  private otherParticipantId(conv: ConversationEntity, userId: string) {
    return conv.participantAId === userId ? conv.participantBId : conv.participantAId;
  }
}

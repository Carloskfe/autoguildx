import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { EventEntity } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(EventEntity) private repo: Repository<EventEntity>) {}

  async create(organizerId: string, dto: Partial<EventEntity>) {
    const event = this.repo.create({ ...dto, organizerId });
    return this.repo.save(event);
  }

  async findAll(page = 1, limit = 20) {
    return this.repo.find({
      where: { startDate: MoreThanOrEqual(new Date()) },
      order: { startDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: string) {
    const event = await this.repo.findOne({ where: { id }, relations: ['organizer'] });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async rsvp(id: string) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    event.rsvpCount += 1;
    return this.repo.save(event);
  }

  async delete(id: string, userId: string) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId) throw new ForbiddenException();
    await this.repo.remove(event);
    return { deleted: true };
  }
}

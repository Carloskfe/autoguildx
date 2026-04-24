import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from '../../../src/events/events.service';
import { EventEntity } from '../../../src/events/entities/event.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('EventsService', () => {
  let service: EventsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(EventEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repo = module.get(getRepositoryToken(EventEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('saves and returns the new event', async () => {
      const dto = { title: 'Car Show', type: 'show', startDate: '2026-06-01T10:00:00Z', location: 'LA' };
      const event = { id: 'e-1', ...dto, organizerId: 'u-1' };
      repo.create.mockReturnValue(event);
      repo.save.mockResolvedValue(event);

      const result = await service.create('u-1', dto as any);
      expect(result).toEqual(event);
    });

    it('converts startDate string to Date object', async () => {
      const dto = { title: 'Meetup', type: 'meetup', startDate: '2026-06-01T10:00:00Z', location: 'LA' };
      repo.create.mockImplementation((d) => d);
      repo.save.mockImplementation((e) => Promise.resolve(e));

      await service.create('u-1', dto as any);

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.startDate).toBeInstanceOf(Date);
    });

    it('omits endDate when not provided', async () => {
      const dto = { title: 'Meetup', type: 'meetup', startDate: '2026-06-01T10:00:00Z', location: 'LA' };
      repo.create.mockImplementation((d) => d);
      repo.save.mockImplementation((e) => Promise.resolve(e));

      await service.create('u-1', dto as any);

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.endDate).toBeUndefined();
    });

    it('converts endDate string to Date when provided', async () => {
      const dto = {
        title: 'Race',
        type: 'race',
        startDate: '2026-06-01T10:00:00Z',
        endDate: '2026-06-01T18:00:00Z',
        location: 'TX',
      };
      repo.create.mockImplementation((d) => d);
      repo.save.mockImplementation((e) => Promise.resolve(e));

      await service.create('u-1', dto as any);

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.endDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('returns paginated upcoming events in ascending order', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll(2, 10);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { startDate: 'ASC' },
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns event with organizer relation', async () => {
      const event = { id: 'e-1', title: 'Show' };
      repo.findOne.mockResolvedValue(event);
      const result = await service.findById('e-1');
      expect(result).toEqual(event);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['organizer'] }),
      );
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rsvp', () => {
    it('increments rsvpCount and saves', async () => {
      const event = { id: 'e-1', rsvpCount: 3 };
      repo.findOne.mockResolvedValue(event);
      repo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.rsvp('e-1');
      expect(result.rsvpCount).toBe(4);
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.rsvp('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('removes event when user is the organizer', async () => {
      const event = { id: 'e-1', organizerId: 'u-1' };
      repo.findOne.mockResolvedValue(event);
      repo.remove.mockResolvedValue(undefined);

      const result = await service.delete('e-1', 'u-1');
      expect(result).toEqual({ deleted: true });
      expect(repo.remove).toHaveBeenCalledWith(event);
    });

    it('throws NotFoundException when event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.delete('bad-id', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not the organizer', async () => {
      repo.findOne.mockResolvedValue({ id: 'e-1', organizerId: 'u-2' });
      await expect(service.delete('e-1', 'u-1')).rejects.toThrow(ForbiddenException);
    });
  });
});

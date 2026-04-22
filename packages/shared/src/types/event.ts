export type EventType = 'meetup' | 'workshop' | 'show' | 'race' | 'other';

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  type: EventType;
  location: string;
  startDate: string;
  endDate?: string;
  mediaUrls: string[];
  rsvpCount: number;
  createdAt: string;
}

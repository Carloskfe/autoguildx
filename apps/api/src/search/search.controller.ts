import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search across profiles, listings, and events' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['profiles', 'listings', 'events'] })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'tag', required: false })
  search(
    @Query('q') q: string,
    @Query('type') type?: 'profiles' | 'listings' | 'events',
    @Query('location') location?: string,
    @Query('tag') tag?: string,
  ) {
    return this.searchService.search(q, type, location, tag);
  }
}

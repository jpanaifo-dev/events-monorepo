import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/public.decorator.js';
import { PublicEventsService } from './public-events.service.js';

@Public()
@Controller('public/organizations/:organizationSlug/events')
export class PublicEventsController {
  constructor(private readonly events: PublicEventsService) {}
  @Get() list(@Param('organizationSlug') slug: string) { return this.events.list(slug); }
  @Get(':eventId') get(@Param('organizationSlug') slug: string, @Param('eventId') id: string) { return this.events.get(slug, id); }
}

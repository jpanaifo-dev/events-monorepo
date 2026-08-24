import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { EventsService } from './events.service.js';

class CreateEventDto { @IsString() @MinLength(2) eventName!: string; @IsDateString() startDate!: string; @IsOptional() @IsString() organizationId?: string; @IsOptional() @IsString() description?: string; }

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}
  @Get() list(@Query('organizationId') organizationId?: string) { return this.events.list(organizationId); }
  @Get(':id') get(@Param('id') id: string) { return this.events.get(id); }
  @Post() create(@Body() dto: CreateEventDto) { return this.events.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.events.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.events.remove(id); }
}

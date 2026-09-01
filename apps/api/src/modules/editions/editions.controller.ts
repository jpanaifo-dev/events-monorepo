import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { EditionsService } from './editions.service.js';
class EditionDto { @IsString() @MinLength(2) name!: string; @IsOptional() @IsDateString() startDate?: string; @IsOptional() @IsDateString() endDate?: string; @IsOptional() @IsString() modality?: string; @IsOptional() @IsString() location?: string; @IsOptional() latitude?: number; @IsOptional() longitude?: number; }
class ActivityDto { @IsString() @MinLength(2) title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsDateString() startsAt?: string; @IsOptional() @IsDateString() endsAt?: string; }
@Controller('events/:eventId/editions')
export class EditionsController {
  constructor(private readonly editions: EditionsService) {}
  @Get() list(@Param('eventId') eventId: string) { return this.editions.list(eventId); }
  @Post() create(@Param('eventId') eventId: string, @Body() dto: EditionDto) { return this.editions.create(eventId, dto); }
  @Get(':id') get(@Param('id') id: string) { return this.editions.get(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.editions.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.editions.remove(id); }
  @Post(':id/activities') activity(@Param('id') id: string, @Body() dto: ActivityDto) { return this.editions.createActivity(id, dto); }
}

import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { ParticipantsService } from './participants.service.js';
class AddParticipantDto { @IsUUID() profileId!: string; }
@Controller()
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}
  @Get('editions/:editionId/participants') list(@Param('editionId') editionId: string) { return this.participants.list(editionId); }
  @Post('editions/:editionId/participants') add(@Param('editionId') editionId: string, @Body() dto: AddParticipantDto) { return this.participants.add(editionId, dto.profileId); }
  @Get('participants/:id') get(@Param('id') id: string) { return this.participants.get(id); }
  @Delete('participants/:id') remove(@Param('id') id: string) { return this.participants.remove(id); }
}

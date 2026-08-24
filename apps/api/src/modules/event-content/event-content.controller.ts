import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { EventContentService } from './event-content.service.js';
class ActivityDto { @IsString() @MinLength(2) title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() startsAt?: string; @IsOptional() @IsString() endsAt?: string; }
class SessionDto { @IsString() @MinLength(2) title!: string; @IsOptional() @IsString() description?: string; }
class SpeakerDto { @IsUUID() profileId!: string; }
class TicketDto { @IsString() @MinLength(2) name!: string; @IsNumber() price!: number; @IsOptional() @IsNumber() capacity?: number; }
class LineDto { @IsString() @MinLength(2) name!: string; @IsOptional() @IsString() description?: string; }
@Controller()
export class EventContentController {
  constructor(private readonly content: EventContentService) {}
  @Get('editions/:editionId/activities') activities(@Param('editionId') id: string) { return this.content.activities(id); }
  @Post('editions/:editionId/activities') createActivity(@Param('editionId') id: string, @Body() dto: ActivityDto) { return this.content.createActivity(id, dto); }
  @Patch('activities/:id') updateActivity(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.content.updateActivity(id, body); }
  @Delete('activities/:id') deleteActivity(@Param('id') id: string) { return this.content.deleteActivity(id); }
  @Get('activities/:activityId/sessions') sessions(@Param('activityId') id: string) { return this.content.sessions(id); }
  @Post('activities/:activityId/sessions') createSession(@Param('activityId') id: string, @Body() dto: SessionDto) { return this.content.createSession(id, dto.title, dto.description); }
  @Post('editions/:editionId/sessions') createSessionForEdition(@Param('editionId') id: string, @Body() dto: SessionDto) { return this.content.createSessionForEdition(id, dto.title, dto.description); }
  @Get('participants/:participantId/sessions') participantSessions(@Param('participantId') id: string) { return this.content.sessionsForParticipant(id); }
  @Patch('sessions/:id') updateSession(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.content.updateSession(id, body); }
  @Delete('sessions/:id') deleteSession(@Param('id') id: string) { return this.content.deleteSession(id); }
  @Post('sessions/:sessionId/speakers') addSpeaker(@Param('sessionId') id: string, @Body() dto: SpeakerDto) { return this.content.addSpeaker(id, dto.profileId); }
  @Delete('session-speakers/:id') removeSpeaker(@Param('id') id: string) { return this.content.removeSpeaker(id); }
  @Get('editions/:editionId/tickets') tickets(@Param('editionId') id: string) { return this.content.tickets(id); }
  @Post('editions/:editionId/tickets') createTicket(@Param('editionId') id: string, @Body() dto: TicketDto) { return this.content.createTicket(id, dto); }
  @Patch('tickets/:id') updateTicket(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.content.updateTicket(id, body); }
  @Delete('tickets/:id') deleteTicket(@Param('id') id: string) { return this.content.deleteTicket(id); }
  @Get('events/:eventId/thematic-lines') thematicLines(@Param('eventId') id: string) { return this.content.thematicLines(id); }
  @Post('events/:eventId/thematic-lines') createLine(@Param('eventId') id: string, @Body() dto: LineDto) { return this.content.createThematicLine(id, dto.name, dto.description); }
  @Patch('thematic-lines/:id') updateLine(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.content.updateThematicLine(id, body); }
  @Delete('thematic-lines/:id') deleteLine(@Param('id') id: string) { return this.content.deleteThematicLine(id); }
  @Get('participant-roles') roles(@Query('mainEventId') mainEventId?: string, @Query('editionId') editionId?: string) { return this.content.roles(mainEventId, editionId); }
  @Post('participant-roles') createRole(@Body() dto: LineDto & { mainEventId?: string; editionId?: string }) { return this.content.createRole({ name: dto.name, mainEventId: dto.mainEventId, editionId: dto.editionId }); }
  @Patch('participant-roles/:id') updateRole(@Param('id') id: string, @Body() dto: LineDto) { return this.content.updateRole(id, { name: dto.name }); }
  @Delete('participant-roles/:id') deleteRole(@Param('id') id: string) { return this.content.deleteRole(id); }
  @Get('events/:eventId/speakers') speakers(@Param('eventId') eventId: string, @Query('editionId') editionId?: string) { return this.content.speakers(eventId, editionId); }
  @Post('events/:eventId/speakers') createSpeaker(@Param('eventId') eventId: string, @Body() dto: { editionId: string; firstName: string; lastName: string; bio?: string }) { return this.content.createSpeaker({ eventId, ...dto }); }
  @Patch('speakers/:id') updateSpeaker(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.content.updateSpeaker(id, body); }
  @Delete('speakers/:id') deleteSpeaker(@Param('id') id: string) { return this.content.deleteSpeaker(id); }
  @Get('sessions/:sessionId/resources') resources(@Param('sessionId') id: string) { return this.content.resources(id); }
  @Post('sessions/:sessionId/resources') addResource(@Param('sessionId') id: string, @Body() body: { name: string; url: string; type?: string }) { return this.content.addResource(id, body); }
  @Patch('resources/:id') updateResource(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.content.updateResource(id, body); }
  @Delete('resources/:id') removeResource(@Param('id') id: string) { return this.content.removeResource(id); }
  @Get('sessions/:sessionId/thematic-lines') sessionLines(@Param('sessionId') id: string) { return this.content.sessionLines(id); }
  @Post('sessions/:sessionId/thematic-lines') addSessionLine(@Param('sessionId') id: string, @Body() body: { thematicLineId: string }) { return this.content.addSessionLine(id, body.thematicLineId); }
  @Delete('sessions/:sessionId/thematic-lines/:thematicLineId') removeSessionLine(@Param('sessionId') sessionId: string, @Param('thematicLineId') thematicLineId: string) { return this.content.removeSessionLine(sessionId, thematicLineId); }
}

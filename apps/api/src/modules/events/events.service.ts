import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}
  list(organizationId?: string) { return this.prisma.mainEvent.findMany({ where: organizationId ? { organizationId } : undefined, include: { editions: true, details: true, thematicLines: true }, orderBy: { startDate: 'desc' } }); }
  async get(id: string) { const event = await this.prisma.mainEvent.findUnique({ where: { id }, include: { editions: { include: { activities: true, participants: true, tickets: true } }, details: true, thematicLines: true } }); if (!event) throw new NotFoundException('Evento no encontrado'); return event; }
  create(data: Record<string, any>) { return this.prisma.mainEvent.create({ data: { eventName: data.eventName, startDate: new Date(data.startDate), organizationId: data.organizationId, description: data.description, coverUrl: data.coverUrl, logoUrl: data.logoUrl, contactEmail: data.contactEmail, status: (data.status ? String(data.status).toUpperCase() : 'DRAFT') as EventStatus } }); }
  update(id: string, data: Record<string, unknown>) {
    const input: any = {};
    for (const key of ['eventName', 'description', 'coverUrl', 'logoUrl', 'organizationId', 'contactEmail', 'venueAddress', 'latitude', 'longitude']) if (data[key] !== undefined) input[key] = data[key];
    if (data.eventMode !== undefined) {
      const mode = String(data.eventMode).trim().toUpperCase();
      input.eventMode = ['PHYSICAL', 'ONLINE', 'HYBRID'].includes(mode) ? mode : null;
    }
    if (data.status !== undefined) input.status = String(data.status).toUpperCase();
    if (typeof data.startDate === 'string') input.startDate = new Date(data.startDate);
    if (typeof data.endDate === 'string') input.endDate = new Date(data.endDate);
    return this.prisma.mainEvent.update({ where: { id }, data: input });
  }
  remove(id: string) { return this.prisma.mainEvent.delete({ where: { id } }); }
  async getSetup(eventId: string) {
    const event = await this.prisma.mainEvent.findUnique({ where: { id: eventId }, select: { id: true, eventName: true, description: true, startDate: true, eventMode: true, contactEmail: true } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    const [editionCount, speakerCount, roleCount, contactCount] = await Promise.all([
      this.prisma.edition.count({ where: { mainEventId: eventId } }),
      this.prisma.eventParticipant.count({ where: { edition: { mainEventId: eventId } } }),
      this.prisma.participantRole.count({ where: { mainEventId: eventId } }),
      this.prisma.eventContact.count({ where: { eventId } }),
    ]);
    const computed = {
      basicInfoCompleted: Boolean(event.eventName?.trim() && event.startDate),
      rolesCompleted: roleCount > 0,
      editionCompleted: editionCount > 0,
      peopleCompleted: speakerCount > 0,
      // Los contactos todavía no tienen una entidad propia; no bloquean el setup inicial.
      contactCompleted: contactCount > 0,
    };
    const completed = Object.values(computed).every(Boolean);
    return this.prisma.eventSetupProgress.upsert({ where: { eventId }, create: { eventId, ...computed, completed }, update: { ...computed, completed } });
  }
  async updateSetup(eventId: string, data: Record<string, unknown>) {
    await this.get(eventId);
    const allowed = ['basicInfoCompleted', 'rolesCompleted', 'editionCompleted', 'peopleCompleted', 'contactCompleted', 'currentStep'];
    const input: Record<string, unknown> = {};
    for (const key of allowed) if (data[key] !== undefined) input[key] = data[key];
    const current = await this.getSetup(eventId);
    const merged = { ...current, ...input };
    input.completed = Boolean(merged.basicInfoCompleted && merged.rolesCompleted && merged.editionCompleted && merged.peopleCompleted && merged.contactCompleted);
    return this.prisma.eventSetupProgress.update({ where: { eventId }, data: input });
  }
  async completeSetup(eventId: string) {
    const progress = await this.getSetup(eventId);
    if (!(progress.basicInfoCompleted && progress.rolesCompleted && progress.editionCompleted && progress.peopleCompleted && progress.contactCompleted)) {
      return this.updateSetup(eventId, {});
    }
    return this.prisma.eventSetupProgress.update({ where: { eventId }, data: { completed: true } });
  }
  contacts(eventId: string) { return this.prisma.eventContact.findMany({ where: { eventId }, orderBy: { createdAt: 'asc' } }); }
  addContact(eventId: string, data: { name: string; email?: string; phone?: string; role?: string }) { return this.prisma.eventContact.create({ data: { eventId, ...data } }); }
  updateContact(id: string, data: { name?: string; email?: string; phone?: string; role?: string }) {
    const input = Object.fromEntries(Object.entries(data).filter(([key, value]) => ['name', 'email', 'phone', 'role'].includes(key) && value !== undefined));
    return this.prisma.eventContact.update({ where: { id }, data: input });
  }
  removeContact(id: string) { return this.prisma.eventContact.delete({ where: { id } }); }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}
  list(organizationId?: string) { return this.prisma.mainEvent.findMany({ where: organizationId ? { organizationId } : undefined, include: { editions: true, details: true, thematicLines: true }, orderBy: { startDate: 'desc' } }); }
  async get(id: string) { const event = await this.prisma.mainEvent.findUnique({ where: { id }, include: { editions: { include: { activities: true, participants: true, tickets: true } }, details: true, thematicLines: true } }); if (!event) throw new NotFoundException('Evento no encontrado'); return event; }
  create(data: { eventName: string; startDate: string; organizationId?: string; description?: string }) { return this.prisma.mainEvent.create({ data: { ...data, startDate: new Date(data.startDate) } }); }
  update(id: string, data: Record<string, unknown>) { const input = { ...data }; if (typeof input.startDate === 'string') input.startDate = new Date(input.startDate); if (typeof input.endDate === 'string') input.endDate = new Date(input.endDate); return this.prisma.mainEvent.update({ where: { id }, data: input }); }
  remove(id: string) { return this.prisma.mainEvent.delete({ where: { id } }); }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
@Injectable()
export class EditionsService {
  constructor(private readonly prisma: PrismaService) {}
  list(eventId: string) { return this.prisma.edition.findMany({ where: { mainEventId: eventId }, include: { activities: true, tickets: true, _count: { select: { participants: true } } }, orderBy: { startDate: 'desc' } }); }
  async get(id: string) { const edition = await this.prisma.edition.findUnique({ where: { id }, include: { activities: { include: { sessions: true } }, tickets: true, participants: { include: { profile: true } } } }); if (!edition) throw new NotFoundException('Edición no encontrada'); return edition; }
  create(eventId: string, data: { name: string; startDate?: string; endDate?: string }) { return this.prisma.edition.create({ data: { mainEventId: eventId, name: data.name, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined } }); }
  update(id: string, data: Record<string, unknown>) {
    const input = { ...data };
    if (typeof input.startDate === 'string') input.startDate = new Date(input.startDate);
    if (input.endDate === '' || input.endDate === null) input.endDate = null;
    else if (typeof input.endDate === 'string') input.endDate = new Date(input.endDate);
    return this.prisma.edition.update({ where: { id }, data: input });
  }
  remove(id: string) { return this.prisma.edition.delete({ where: { id } }); }
  createActivity(editionId: string, data: { title: string; description?: string; startsAt?: string; endsAt?: string }) { return this.prisma.eventActivity.create({ data: { editionId, title: data.title, description: data.description, startsAt: data.startsAt ? new Date(data.startsAt) : undefined, endsAt: data.endsAt ? new Date(data.endsAt) : undefined } }); }
}

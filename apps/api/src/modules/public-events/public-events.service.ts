import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class PublicEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationSlug: string) {
    const organization = await this.prisma.organization.findFirst({ where: { slug: organizationSlug, isActive: true }, select: { id: true, name: true, slug: true, description: true, logoUrl: true, coverUrl: true, portal: { select: { isPublished: true, heroTitle: true, heroDescription: true, heroImageUrl: true, featuredEventId: true, sections: true, navigation: true, seoTitle: true, seoDescription: true } } } });
    if (!organization) throw new NotFoundException('Institución no encontrada');
    const events = await this.prisma.mainEvent.findMany({ where: { organizationId: organization.id, status: 'PUBLISHED' }, select: { id: true, eventName: true, description: true, startDate: true, endDate: true, eventMode: true, coverUrl: true, logoUrl: true, venueAddress: true, contactEmail: true }, orderBy: { startDate: 'asc' } });
    return { organization, events };
  }

  async get(organizationSlug: string, eventId: string) {
    const item = await this.prisma.mainEvent.findFirst({
      where: { id: eventId, status: 'PUBLISHED', organization: { slug: organizationSlug, isActive: true } },
      select: { id: true, eventName: true, description: true, startDate: true, endDate: true, eventMode: true, coverUrl: true, logoUrl: true, venueAddress: true, contactEmail: true, details: { select: { content: true, socialLinks: true, media: true, sponsors: true, faqs: true } }, editions: { select: { id: true, name: true, startDate: true, endDate: true, modality: true, location: true, activities: { select: { id: true, title: true, description: true, startsAt: true, endsAt: true } } } }, registrationForms: { where: { status: 'PUBLISHED' }, select: { title: true, description: true, slug: true, opensAt: true, closesAt: true } } },
    });
    if (!item) throw new NotFoundException('Evento no encontrado');
    return item;
  }
}

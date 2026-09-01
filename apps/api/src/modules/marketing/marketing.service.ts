import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}
  contacts(organizationId: string, search?: string) { return this.prisma.marketingContact.findMany({ where: { organizationId, ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }] } : {}) }, orderBy: { createdAt: 'desc' } }); }
  createContact(organizationId: string, data: any) { return this.prisma.marketingContact.upsert({ where: { organizationId_email: { organizationId, email: data.email.trim().toLowerCase() } }, update: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, tags: data.tags || [], status: data.status || 'SUBSCRIBED', consentedAt: data.consentedAt ? new Date(data.consentedAt) : undefined }, create: { organizationId, email: data.email.trim().toLowerCase(), firstName: data.firstName, lastName: data.lastName, phone: data.phone, tags: data.tags || [], status: data.status || 'SUBSCRIBED', consentedAt: data.consentedAt ? new Date(data.consentedAt) : new Date() } }); }
  segments(organizationId: string) { return this.prisma.marketingSegment.findMany({ where: { organizationId }, include: { _count: { select: { members: true } } }, orderBy: { name: 'asc' } }); }
  createSegment(organizationId: string, data: any) { return this.prisma.marketingSegment.create({ data: { organizationId, name: data.name.trim(), description: data.description } }); }
  removeContact(organizationId: string, id: string) { return this.prisma.marketingContact.deleteMany({ where: { id, organizationId } }); }
  removeSegment(organizationId: string, id: string) { return this.prisma.marketingSegment.deleteMany({ where: { id, organizationId } }); }
  campaigns(organizationId: string) { return this.prisma.marketingCampaign.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } }); }
  createCampaign(organizationId: string, data: any) { return this.prisma.marketingCampaign.create({ data: { organizationId, name: data.name.trim(), subject: data.subject, segmentIds: data.segmentIds || [], scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null } }); }
  automations(organizationId: string) { return this.prisma.marketingAutomation.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } }); }
  createAutomation(organizationId: string, data: any) { return this.prisma.marketingAutomation.create({ data: { organizationId, name: data.name.trim(), trigger: data.trigger, segmentIds: data.segmentIds || [] } }); }
  async sendCampaign(organizationId: string, id: string) {
    const campaign = await this.prisma.marketingCampaign.findFirst({ where: { id, organizationId } });
    if (!campaign) throw new Error('Campaña no encontrada');
    const ids = Array.isArray(campaign.segmentIds) ? campaign.segmentIds as string[] : [];
    const members = await this.prisma.marketingSegmentMember.findMany({ where: { segmentId: { in: ids } }, include: { contact: true }, distinct: ['contactId'] });
    const contacts = members.map(m => m.contact).filter(c => c.status === 'SUBSCRIBED');
    let sent = 0;
    for (const contact of contacts) { const result = await this.mail.send({ to: contact.email, subject: campaign.subject || campaign.name, html: `<p>${campaign.subject || campaign.name}</p>` }); if (result.sent) sent++; }
    await this.prisma.marketingCampaign.update({ where: { id }, data: { status: 'SENT' } });
    return { sent, total: contacts.length };
  }
}

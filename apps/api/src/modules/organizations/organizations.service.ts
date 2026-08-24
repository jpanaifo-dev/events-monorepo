import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.organization.findMany({ include: { branches: true, _count: { select: { members: true, events: true } } }, orderBy: { createdAt: 'desc' } }); }
  async get(id: string) { const item = await this.prisma.organization.findUnique({ where: { id }, include: { branches: true, members: { include: { profile: true } }, events: true } }); if (!item) throw new NotFoundException('Organización no encontrada'); return item; }
  create(data: { name: string; slug: string; description?: string }) { return this.prisma.organization.create({ data }); }
  update(id: string, data: Record<string, unknown>) { return this.prisma.organization.update({ where: { id }, data }); }
}

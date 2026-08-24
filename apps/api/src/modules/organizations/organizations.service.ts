import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.organization.findMany({ include: { branches: true, _count: { select: { members: true, events: true } } }, orderBy: { createdAt: 'desc' } }); }
  async get(id: string) { const item = await this.prisma.organization.findUnique({ where: { id }, include: { branches: true, members: { include: { profile: true } }, events: true } }); if (!item) throw new NotFoundException('Organización no encontrada'); return item; }
  create(data: { name: string; slug: string; description?: string }) { return this.prisma.organization.create({ data }); }
  update(id: string, data: Record<string, unknown>) { return this.prisma.organization.update({ where: { id }, data }); }
  branches(organizationId: string) { return this.prisma.organizationBranch.findMany({ where: { organizationId }, orderBy: { name: 'asc' } }); }
  addBranch(organizationId: string, data: { name: string; address?: string }) { return this.prisma.organizationBranch.create({ data: { organizationId, name: data.name, address: data.address } }); }
  updateBranch(id: string, data: Record<string, unknown>) { return this.prisma.organizationBranch.update({ where: { id }, data }); }
  removeBranch(id: string) { return this.prisma.organizationBranch.delete({ where: { id } }); }
  members(organizationId: string) { return this.prisma.organizationMember.findMany({ where: { organizationId }, include: { profile: true }, orderBy: { createdAt: 'desc' } }); }
  addMember(organizationId: string, profileId: string, role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'MEMBER' = 'MEMBER') { return this.prisma.organizationMember.create({ data: { organizationId, profileId, role }, include: { profile: true } }); }
  updateMember(id: string, role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'MEMBER') { return this.prisma.organizationMember.update({ where: { id }, data: { role } }); }
  removeMember(id: string) { return this.prisma.organizationMember.delete({ where: { id } }); }
}

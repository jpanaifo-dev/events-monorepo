import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.profile.findMany({ orderBy: { createdAt: 'desc' } }); }
  async get(id: string) { const profile = await this.prisma.profile.findUnique({ where: { id }, include: { education: true, employment: true, certifications: true } }); if (!profile) throw new NotFoundException('Perfil no encontrado'); return profile; }
  update(id: string, data: Record<string, unknown>) { return this.prisma.profile.update({ where: { id }, data }); }
}

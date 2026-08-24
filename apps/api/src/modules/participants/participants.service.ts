import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}
  list(editionId: string) { return this.prisma.eventParticipant.findMany({ where: { editionId }, include: { profile: true, certificates: true }, orderBy: { registeredAt: 'desc' } }); }
  async add(editionId: string, profileId: string) { const exists = await this.prisma.eventParticipant.findUnique({ where: { editionId_profileId: { editionId, profileId } } }); if (exists) throw new ConflictException('El perfil ya está registrado'); return this.prisma.eventParticipant.create({ data: { editionId, profileId }, include: { profile: true } }); }
  async get(id: string) { const item = await this.prisma.eventParticipant.findUnique({ where: { id }, include: { profile: true, edition: true, certificates: true } }); if (!item) throw new NotFoundException('Participante no encontrado'); return item; }
  remove(id: string) { return this.prisma.eventParticipant.delete({ where: { id } }); }
}

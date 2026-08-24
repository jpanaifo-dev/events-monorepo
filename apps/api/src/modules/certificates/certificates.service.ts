import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}
  list(participantId?: string) { return this.prisma.participantCertificate.findMany({ where: participantId ? { participantId } : undefined, include: { participant: { include: { profile: true, edition: { include: { mainEvent: true } } } }, template: true }, orderBy: { issuedAt: 'desc' } }); }
  async verify(code: string) { const certificate = await this.prisma.participantCertificate.findUnique({ where: { code }, include: { participant: { include: { profile: true, edition: { include: { mainEvent: true } } } }, template: true } }); if (!certificate) throw new NotFoundException('Certificado no encontrado'); await this.prisma.certificateTrackingLog.create({ data: { certificateId: certificate.id, action: 'verified' } }); return certificate; }
  issue(participantId: string, templateId?: string) { return this.prisma.participantCertificate.create({ data: { participantId, templateId, code: `CERT-${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}` } }); }
}

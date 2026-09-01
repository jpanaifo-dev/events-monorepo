import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}
  list(participantId?: string) { return this.prisma.participantCertificate.findMany({ where: participantId ? { participantId } : undefined, include: { participant: { include: { profile: true, edition: { include: { mainEvent: true } } } }, template: true }, orderBy: { issuedAt: 'desc' } }); }
  async verify(code: string) { const certificate = await this.prisma.participantCertificate.findUnique({ where: { code }, include: { participant: { include: { profile: true, edition: { include: { mainEvent: true } } } }, template: true } }); if (!certificate) throw new NotFoundException('Certificado no encontrado'); await this.prisma.certificateTrackingLog.create({ data: { certificateId: certificate.id, action: 'verified' } }); return certificate; }
  issue(participantId: string, templateId?: string) { return this.prisma.participantCertificate.create({ data: { participantId, templateId, code: `CERT-${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}` } }); }
  templates() { return this.prisma.certificateTemplate.findMany({ orderBy: { createdAt: 'desc' } }); }
  createTemplate(data: { name: string; design?: unknown }) { return this.prisma.certificateTemplate.create({ data: { name: data.name, design: data.design as any } }); }
  updateTemplate(id: string, data: Record<string, unknown>) { return this.prisma.certificateTemplate.update({ where: { id }, data }); }
  removeTemplate(id: string) { return this.prisma.certificateTemplate.delete({ where: { id } }); }
  logs(certificateId: string) { return this.prisma.certificateTrackingLog.findMany({ where: { certificateId }, orderBy: { createdAt: 'desc' } }); }
  addLog(certificateId: string, action: string, ipAddress?: string) { return this.prisma.certificateTrackingLog.create({ data: { certificateId, action, ipAddress } }); }
  update(id: string, data: { status?: 'ISSUED' | 'REVOKED' }) { return this.prisma.participantCertificate.update({ where: { id }, data }); }
}

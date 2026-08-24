import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.profile.findMany({ orderBy: { createdAt: 'desc' } }); }
  create(data: { id: string; firstName: string; lastName: string; email?: string; phone?: string; bio?: string }) { return this.prisma.profile.create({ data: { id: data.id, firstName: data.firstName, lastName: data.lastName, phone: data.phone, bio: data.bio } }); }
  async get(id: string) { const profile = await this.prisma.profile.findUnique({ where: { id }, include: { education: true, employment: true, certifications: true } }); if (!profile) throw new NotFoundException('Perfil no encontrado'); return profile; }
  update(id: string, data: Record<string, unknown>) { return this.prisma.profile.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.profile.delete({ where: { id } }); }
  education(userId: string) { return this.prisma.education.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }); }
  addEducation(userId: string, data: { institution: string; degree?: string; startDate?: string; endDate?: string }) { return this.prisma.education.create({ data: { userId, institution: data.institution, degree: data.degree, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined } }); }
  updateEducation(id: string, data: Record<string, unknown>) { return this.prisma.education.update({ where: { id }, data }); }
  removeEducation(id: string) { return this.prisma.education.delete({ where: { id } }); }
  employment(userId: string) { return this.prisma.employmentHistory.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }); }
  addEmployment(userId: string, data: { company: string; position?: string; startDate?: string; endDate?: string }) { return this.prisma.employmentHistory.create({ data: { userId, company: data.company, position: data.position, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined } }); }
  updateEmployment(id: string, data: Record<string, unknown>) { return this.prisma.employmentHistory.update({ where: { id }, data }); }
  removeEmployment(id: string) { return this.prisma.employmentHistory.delete({ where: { id } }); }
  certifications(userId: string) { return this.prisma.certification.findMany({ where: { userId }, orderBy: { issuedAt: 'desc' } }); }
  addCertification(userId: string, data: { name: string; issuer?: string; issuedAt?: string }) { return this.prisma.certification.create({ data: { userId, name: data.name, issuer: data.issuer, issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined } }); }
  updateCertification(id: string, data: Record<string, unknown>) { return this.prisma.certification.update({ where: { id }, data }); }
  removeCertification(id: string) { return this.prisma.certification.delete({ where: { id } }); }
}

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service.js';
import { randomBytes } from 'node:crypto';
import { createHash } from 'node:crypto';
import { EmailService } from './email.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly email: EmailService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.authUser.findUnique({ where: { email }, include: { profile: true } });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas');
    const payload = { sub: user.id, email: user.email };
    return { accessToken: await this.jwt.signAsync({ ...payload, role: user.role }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' }), user: { ...(user.profile ?? {}), id: user.id, email: user.email, role: user.role } };
  }
  async createAccount(data: { email: string; password?: string; firstName?: string; lastName?: string; role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER' }) { const password = data.password ?? randomBytes(12).toString('base64url'); const id = randomBytes(16).toString('hex'); const passwordHash = await bcrypt.hash(password, 10); const user = await this.prisma.authUser.create({ data: { id, email: data.email.toLowerCase().trim(), passwordHash, role: data.role ?? 'USER' } }); const profile = await this.prisma.profile.create({ data: { authUserId: user.id, firstName: data.firstName, lastName: data.lastName } }); const delivery = await this.email.credentials(user.email, `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(), password); return { id: user.id, email: user.email, role: user.role, isActive: user.isActive, profile, emailSent: delivery.sent }; }
  listAccounts() { return this.prisma.authUser.findMany({ include: { profile: true }, orderBy: { createdAt: 'desc' } }); }
  async updateAccount(id: string, data: { email?: string; role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER'; plan?: 'FREE' | 'PREMIUM' | 'ENTERPRISE'; isActive?: boolean; password?: string }) {
    const exists = await this.prisma.authUser.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Cuenta no encontrada');
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    return this.prisma.authUser.update({ where: { id }, data: { email: data.email?.toLowerCase().trim(), role: data.role, plan: data.plan, isActive: data.isActive, passwordHash }, include: { profile: true } });
  }
  async removeAccount(id: string) { const exists = await this.prisma.authUser.findUnique({ where: { id } }); if (!exists) throw new NotFoundException('Cuenta no encontrada'); return this.prisma.authUser.delete({ where: { id } }); }
  async resetPasswordByAdmin(id: string) { const user = await this.prisma.authUser.findUnique({ where: { id }, include: { profile: true } }); if (!user) throw new NotFoundException('Cuenta no encontrada'); const password = randomBytes(12).toString('base64url'); await this.prisma.authUser.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10), passwordResetTokenHash: null, passwordResetExpiresAt: null } }); const delivery = await this.email.credentials(user.email, `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim(), password); return { accepted: true, emailSent: delivery.sent }; }
  async forgotPassword(email: string) { const user = await this.prisma.authUser.findUnique({ where: { email: email.toLowerCase().trim() } }); if (!user) return { accepted: true }; const token = randomBytes(32).toString('hex'); await this.prisma.authUser.update({ where: { id: user.id }, data: { passwordResetTokenHash: createHash('sha256').update(token).digest('hex'), passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000) } }); const url = `${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/reset-password?token=${token}`; await this.email.reset(user.email, url); return { accepted: true }; }
  async resetPassword(token: string, password: string) { const hash = createHash('sha256').update(token).digest('hex'); const user = await this.prisma.authUser.findFirst({ where: { passwordResetTokenHash: hash, passwordResetExpiresAt: { gt: new Date() } } }); if (!user) throw new UnauthorizedException('El enlace de recuperación no es válido o venció'); await this.prisma.authUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10), passwordResetTokenHash: null, passwordResetExpiresAt: null } }); return { accepted: true }; }
}

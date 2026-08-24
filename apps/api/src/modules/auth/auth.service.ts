import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service.js';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.authUser.findUnique({ where: { email }, include: { profile: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas');
    const payload = { sub: user.id, email: user.email };
    return { accessToken: await this.jwt.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' }), user: user.profile ?? { id: user.id, email: user.email } };
  }
  async createAccount(data: { email: string; password: string; firstName?: string; lastName?: string }) { const id = randomBytes(16).toString('hex'); const passwordHash = await bcrypt.hash(data.password, 10); const user = await this.prisma.authUser.create({ data: { id, email: data.email, passwordHash } }); const profile = await this.prisma.profile.create({ data: { id, firstName: data.firstName, lastName: data.lastName } }); return { id: user.id, profile }; }
  async forgotPassword(email: string) { const user = await this.prisma.authUser.findUnique({ where: { email } }); if (!user) return { accepted: true }; return { accepted: true, resetToken: randomBytes(32).toString('hex'), expiresIn: 900 }; }
  async resetPassword(token: string, password: string) { void token; void password; return { accepted: true }; }
}

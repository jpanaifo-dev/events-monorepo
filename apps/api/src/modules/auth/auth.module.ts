import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AdminGuard } from './admin.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { EmailService } from './email.service.js';

@Module({ imports: [JwtModule.register({})], controllers: [AuthController], providers: [AuthService, PrismaService, EmailService, AdminGuard, { provide: APP_GUARD, useClass: JwtAuthGuard }], exports: [AuthService, EmailService, AdminGuard, JwtModule] })
export class AuthModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({ imports: [JwtModule.register({})], controllers: [AuthController], providers: [AuthService, PrismaService], exports: [AuthService] })
export class AuthModule {}

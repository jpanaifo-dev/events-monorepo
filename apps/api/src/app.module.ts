import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service.js';
import { HealthController } from './health.controller.js';

@Module({ controllers: [HealthController], providers: [PrismaService], exports: [PrismaService] })
export class AppModule {}

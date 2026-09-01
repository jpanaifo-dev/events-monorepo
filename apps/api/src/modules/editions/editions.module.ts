import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EditionsController } from './editions.controller.js';
import { EditionsService } from './editions.service.js';
@Module({ controllers: [EditionsController], providers: [EditionsService, PrismaService] })
export class EditionsModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EventContentController } from './event-content.controller.js';
import { EventContentService } from './event-content.service.js';
@Module({ controllers: [EventContentController], providers: [EventContentService, PrismaService] })
export class EventContentModule {}

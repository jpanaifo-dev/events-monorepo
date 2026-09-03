import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({ controllers: [EventsController], providers: [EventsService, PrismaService] })
export class EventsModule {}

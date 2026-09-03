import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module.js';
import { PublicEventsController } from './public-events.controller.js';
import { PublicEventsService } from './public-events.service.js';

@Module({ imports: [PrismaModule], controllers: [PublicEventsController], providers: [PublicEventsService] })
export class PublicEventsModule {}

import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MailModule } from '../mail/mail.module.js';
@Module({ imports: [MailModule], controllers: [MarketingController], providers: [MarketingService, PrismaService] })
export class MarketingModule {}

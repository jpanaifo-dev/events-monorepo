import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MailModule } from '../mail/mail.module.js';
@Module({ imports: [MailModule], controllers: [MarketingController], providers: [MarketingService, PrismaService] })
export class MarketingModule {}
=======
import { PrismaModule } from '../../database/prisma.module.js';
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';
import { AutomationService } from './automation.service.js';
import { AutomationController } from './automation.controller.js';
@Module({ imports: [PrismaModule], controllers: [MarketingController, AutomationController], providers: [MarketingService, AutomationService] }) export class MarketingModule {}
>>>>>>> d0018d3b20edf16edf973cf7463b3c687d1a0394

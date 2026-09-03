import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module.js';
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';
import { AutomationService } from './automation.service.js';
import { AutomationController } from './automation.controller.js';
@Module({ imports: [PrismaModule], controllers: [MarketingController, AutomationController], providers: [MarketingService, AutomationService], exports: [AutomationService] }) export class MarketingModule { }

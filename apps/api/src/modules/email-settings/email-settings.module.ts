import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';
import { EmailSettingsController } from './email-settings.controller.js';
import { EmailSettingsService } from './email-settings.service.js';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [EmailSettingsController],
  providers: [EmailSettingsService],
  exports: [EmailSettingsService],
})
export class EmailSettingsModule {}

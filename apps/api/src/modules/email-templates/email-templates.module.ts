import { Module } from '@nestjs/common';
import { EmailTemplatesController } from './email-templates.controller.js';
import { EmailTemplatesService } from './email-templates.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [MailModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, PrismaService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}

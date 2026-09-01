import { Module } from '@nestjs/common';
import { RegistrationFormsController } from './registration-forms.controller.js';
import { RegistrationFormsService } from './registration-forms.service.js';
import { PrismaService } from '../../database/prisma.service.js';
@Module({ controllers: [RegistrationFormsController], providers: [RegistrationFormsService, PrismaService] })
export class RegistrationFormsModule {}

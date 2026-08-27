import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({ imports: [AuthModule], controllers: [OrganizationsController], providers: [OrganizationsService, PrismaService] })
export class OrganizationsModule {}

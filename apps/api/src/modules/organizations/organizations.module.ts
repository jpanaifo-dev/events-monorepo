import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({ controllers: [OrganizationsController], providers: [OrganizationsService, PrismaService] })
export class OrganizationsModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({ controllers: [ProfilesController], providers: [ProfilesService, PrismaService] })
export class ProfilesModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { R2StorageService } from './r2-storage.service.js';

@Module({ controllers: [MediaController], providers: [MediaService, R2StorageService, PrismaService], exports: [MediaService] })
export class MediaModule {}

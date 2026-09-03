import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CertificatesController } from './certificates.controller.js';
import { CertificatesService } from './certificates.service.js';
@Module({ controllers: [CertificatesController], providers: [CertificatesService, PrismaService] })
export class CertificatesModule {}

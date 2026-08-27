import { Controller, Get } from '@nestjs/common';
import { Public } from './common/public.decorator.js';
import { PrismaService } from './database/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public() @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'events-api', timestamp: new Date().toISOString() };
  }
}

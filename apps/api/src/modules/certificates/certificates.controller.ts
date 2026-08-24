import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { CertificatesService } from './certificates.service.js';
class IssueCertificateDto { @IsUUID() participantId!: string; @IsOptional() @IsUUID() templateId?: string; }
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}
  @Get() list(@Query('participantId') participantId?: string) { return this.certificates.list(participantId); }
  @Get('verify/:code') verify(@Param('code') code: string) { return this.certificates.verify(code); }
  @Post() issue(@Body() dto: IssueCertificateDto) { return this.certificates.issue(dto.participantId, dto.templateId); }
}

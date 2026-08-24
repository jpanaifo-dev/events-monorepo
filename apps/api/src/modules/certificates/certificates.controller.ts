import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { CertificatesService } from './certificates.service.js';
class IssueCertificateDto { @IsUUID() participantId!: string; @IsOptional() @IsUUID() templateId?: string; }
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}
  @Get() list(@Query('participantId') participantId?: string) { return this.certificates.list(participantId); }
  @Get('verify/:code') verify(@Param('code') code: string) { return this.certificates.verify(code); }
  @Post() issue(@Body() dto: IssueCertificateDto) { return this.certificates.issue(dto.participantId, dto.templateId); }
  @Get('templates') templates() { return this.certificates.templates(); }
  @Post('templates') createTemplate(@Body() body: any) { return this.certificates.createTemplate(body); }
  @Patch('templates/:id') updateTemplate(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.certificates.updateTemplate(id, body); }
  @Delete('templates/:id') removeTemplate(@Param('id') id: string) { return this.certificates.removeTemplate(id); }
  @Get(':id/logs') logs(@Param('id') id: string) { return this.certificates.logs(id); }
  @Post(':id/logs') addLog(@Param('id') id: string, @Body() body: { action: string; ipAddress?: string }) { return this.certificates.addLog(id, body.action, body.ipAddress); }
}

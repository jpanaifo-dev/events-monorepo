import { Controller, Get, Put, Post, Param, Body } from '@nestjs/common';
import { EmailSettingsService } from './email-settings.service.js';
import { UpdateEmailSettingsDto, TestEmailSettingsDto } from './email-settings.dto.js';

@Controller('organizations/:organizationId/email-settings')
export class EmailSettingsController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  @Get()
  getSettings(@Param('organizationId') organizationId: string) {
    return this.emailSettingsService.getSettings(organizationId);
  }

  @Put()
  updateSettings(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateEmailSettingsDto,
  ) {
    return this.emailSettingsService.updateSettings(organizationId, dto);
  }

  @Post('test')
  testConnection(
    @Param('organizationId') organizationId: string,
    @Body() dto: TestEmailSettingsDto,
  ) {
    return this.emailSettingsService.testConnection(organizationId, dto);
  }
}

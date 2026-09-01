import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
@Controller('organizations/:organizationId/marketing')
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}
  @Get('contacts') contacts(@Param('organizationId') id: string, @Query('search') search?: string) { return this.marketing.contacts(id, search); }
  @Post('contacts') createContact(@Param('organizationId') id: string, @Body() body: any) { return this.marketing.createContact(id, body); }
  @Delete('contacts/:contactId') removeContact(@Param('organizationId') organizationId: string, @Param('contactId') contactId: string) { return this.marketing.removeContact(organizationId, contactId); }
  @Get('segments') segments(@Param('organizationId') id: string) { return this.marketing.segments(id); }
  @Post('segments') createSegment(@Param('organizationId') id: string, @Body() body: any) { return this.marketing.createSegment(id, body); }
  @Delete('segments/:segmentId') removeSegment(@Param('organizationId') organizationId: string, @Param('segmentId') segmentId: string) { return this.marketing.removeSegment(organizationId, segmentId); }
  @Get('campaigns') campaigns(@Param('organizationId') id: string) { return this.marketing.campaigns(id); }
  @Post('campaigns') createCampaign(@Param('organizationId') id: string, @Body() body: any) { return this.marketing.createCampaign(id, body); }
  @Post('campaigns/:campaignId/send') sendCampaign(@Param('organizationId') organizationId: string, @Param('campaignId') campaignId: string) { return this.marketing.sendCampaign(organizationId, campaignId); }
  @Get('automations') automations(@Param('organizationId') id: string) { return this.marketing.automations(id); }
  @Post('automations') createAutomation(@Param('organizationId') id: string, @Body() body: any) { return this.marketing.createAutomation(id, body); }
}

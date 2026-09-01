<<<<<<< HEAD
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
=======
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
@Controller('organizations/:organizationId/marketing') export class MarketingController { constructor(private readonly service: MarketingService) {} @Get('contacts') contacts(@Param('organizationId') id:string){return this.service.contacts(id)} @Post('contacts') contact(@Param('organizationId') id:string,@Body() data:any){return this.service.createContact(id,data)} @Delete('contacts/:id') removeContact(@Param('organizationId') o:string,@Param('id') id:string){return this.service.removeContact(o,id)} @Get('segments') segments(@Param('organizationId') id:string){return this.service.segments(id)} @Post('segments') segment(@Param('organizationId') id:string,@Body() data:any){return this.service.createSegment(id,data)} @Delete('segments/:id') removeSegment(@Param('organizationId') o:string,@Param('id') id:string){return this.service.removeSegment(o,id)} }
>>>>>>> d0018d3b20edf16edf973cf7463b3c687d1a0394

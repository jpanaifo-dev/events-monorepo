import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}
  @Get() list() { return this.profiles.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.profiles.get(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.profiles.update(id, body); }
}

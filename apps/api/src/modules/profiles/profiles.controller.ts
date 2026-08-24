import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}
  @Get() list() { return this.profiles.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.profiles.get(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.profiles.update(id, body); }
  @Get(':id/education') education(@Param('id') id: string) { return this.profiles.education(id); }
  @Post(':id/education') addEducation(@Param('id') id: string, @Body() body: any) { return this.profiles.addEducation(id, body); }
  @Patch('education/:entryId') updateEducation(@Param('entryId') id: string, @Body() body: Record<string, unknown>) { return this.profiles.updateEducation(id, body); }
  @Delete('education/:entryId') removeEducation(@Param('entryId') id: string) { return this.profiles.removeEducation(id); }
  @Get(':id/employment') employment(@Param('id') id: string) { return this.profiles.employment(id); }
  @Post(':id/employment') addEmployment(@Param('id') id: string, @Body() body: any) { return this.profiles.addEmployment(id, body); }
  @Patch('employment/:entryId') updateEmployment(@Param('entryId') id: string, @Body() body: Record<string, unknown>) { return this.profiles.updateEmployment(id, body); }
  @Delete('employment/:entryId') removeEmployment(@Param('entryId') id: string) { return this.profiles.removeEmployment(id); }
  @Get(':id/certifications') certifications(@Param('id') id: string) { return this.profiles.certifications(id); }
  @Post(':id/certifications') addCertification(@Param('id') id: string, @Body() body: any) { return this.profiles.addCertification(id, body); }
  @Patch('certifications/:entryId') updateCertification(@Param('entryId') id: string, @Body() body: Record<string, unknown>) { return this.profiles.updateCertification(id, body); }
  @Delete('certifications/:entryId') removeCertification(@Param('entryId') id: string) { return this.profiles.removeCertification(id); }
}

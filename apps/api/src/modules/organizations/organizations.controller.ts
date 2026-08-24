import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { OrganizationsService } from './organizations.service.js';

class CreateOrganizationDto { @IsString() @MinLength(2) name!: string; @IsString() @MinLength(2) slug!: string; @IsOptional() @IsString() description?: string; }

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}
  @Get() list() { return this.organizations.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.organizations.get(id); }
  @Post() create(@Body() dto: CreateOrganizationDto) { return this.organizations.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.organizations.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.organizations.remove(id); }
  @Get(':id/branches') branches(@Param('id') id: string) { return this.organizations.branches(id); }
  @Post(':id/branches') addBranch(@Param('id') id: string, @Body() body: any) { return this.organizations.addBranch(id, body); }
  @Patch('branches/:branchId') updateBranch(@Param('branchId') id: string, @Body() body: Record<string, unknown>) { return this.organizations.updateBranch(id, body); }
  @Delete('branches/:branchId') removeBranch(@Param('branchId') id: string) { return this.organizations.removeBranch(id); }
  @Get(':id/members') members(@Param('id') id: string) { return this.organizations.members(id); }
  @Post(':id/members') addMember(@Param('id') id: string, @Body() body: any) { return this.organizations.addMember(id, body.profileId, body.role); }
  @Patch('members/:memberId') updateMember(@Param('memberId') id: string, @Body() body: any) { return this.organizations.updateMember(id, body.role); }
  @Delete('members/:memberId') removeMember(@Param('memberId') id: string) { return this.organizations.removeMember(id); }
}

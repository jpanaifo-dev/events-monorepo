import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
}

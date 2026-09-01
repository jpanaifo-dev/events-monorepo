import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { RegistrationFormsService } from './registration-forms.service.js';
import { Public } from '../../common/public.decorator.js';
class FormDto { @IsString() @MinLength(2) title!: string; @IsString() @MinLength(2) slug!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() editionId?: string; @IsOptional() @IsIn(['DRAFT','PUBLISHED','PAUSED','ARCHIVED']) status?: string; @IsOptional() @IsArray() fields?: any[]; @IsOptional() @IsBoolean() allowEditionSelection?: boolean; }
@Controller()
export class RegistrationFormsController {
  constructor(private readonly forms: RegistrationFormsService) {}

  @Get('events/:eventId/registration-forms')
  list(@Param('eventId') eventId: string) {
    return this.forms.list(eventId);
  }

  @Get('registration-forms/:id')
  get(@Param('id') id: string) {
    return this.forms.get(id);
  }

  @Post('events/:eventId/registration-forms')
  create(@Param('eventId') eventId: string, @Body() data: FormDto) {
    return this.forms.create(eventId, data);
  }

  @Patch('registration-forms/:id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.forms.update(id, data);
  }

  @Delete('registration-forms/:id')
  remove(@Param('id') id: string) {
    return this.forms.remove(id);
  }

  @Public() @Get('public/registration-forms/:slug')
  publicForm(@Param('slug') slug: string) {
    return this.forms.publicForm(slug);
  }

  @Public() @Post('public/registration-forms/:slug/submissions')
  submit(@Param('slug') slug: string, @Body() data: { answers: Record<string, unknown>; editionId?: string }) {
    return this.forms.submit(slug, data.answers || {}, data.editionId);
  }
}

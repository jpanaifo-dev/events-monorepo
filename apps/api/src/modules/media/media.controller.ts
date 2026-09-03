import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service.js';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Body() body: { ownerType: string; ownerId: string; purpose?: string; position?: string; isFeatured?: string; orientation?: string; organizationId?: string }, @Req() request: any) {
    return this.media.upload(file, body, request.user);
  }

  @Get()
  list(@Query('ownerType') ownerType: string, @Query('ownerId') ownerId: string, @Req() request: any) { return this.media.list(ownerType, ownerId, request.user); }

  @Get('library/:organizationId')
  library(@Param('organizationId') organizationId: string, @Req() request: any) { return this.media.library(organizationId, request.user); }

  @Post(':id/attach')
  attach(@Param('id') id: string, @Body() body: { ownerType: string; ownerId: string; purpose?: string; position?: number; isFeatured?: boolean }, @Req() request: any) { return this.media.attach(id, body, request.user); }

  @Post('reorder')
  reorder(@Body() body: { ownerType: string; ownerId: string; items: Array<{ id: string; position: number; isFeatured?: boolean }> }, @Req() request: any) { return this.media.reorder(body.ownerType, body.ownerId, body.items, request.user); }

  @Delete('links/:linkId')
  unlink(@Param('linkId') linkId: string, @Req() request: any) { return this.media.unlink(linkId, request.user); }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: any) { return this.media.remove(id, request.user); }
}

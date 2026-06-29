import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { FilesService } from './files.service';

@Controller('api/files')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get()
  @RequirePermissions('system:config', 'file:manage')
  findAll() {
    return this.filesService.findAll();
  }

  @Post('upload')
  @RequirePermissions('file:manage', 'system:config')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string; tenantId: string } },
  ) {
    return this.filesService.upload(file, req.user.userId, req.user.tenantId);
  }

  @Get(':id/url')
  @RequirePermissions('file:manage', 'system:config')
  getUrl(@Param('id') id: string) {
    return this.filesService.getDownloadUrl(id);
  }
}

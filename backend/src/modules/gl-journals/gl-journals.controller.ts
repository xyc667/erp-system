import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateGlJournalDto } from './dto/create-gl-journal.dto';
import { GlJournalsService } from './gl-journals.service';

@Controller('api/finance/journals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GlJournalsController {
  constructor(private glJournalsService: GlJournalsService) {}

  @Get()
  @RequirePermissions('finance:gl')
  findAll() {
    return this.glJournalsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('finance:gl')
  findById(@Param('id') id: string) {
    return this.glJournalsService.findById(id);
  }

  @Post()
  @RequirePermissions('finance:gl')
  create(@Body() dto: CreateGlJournalDto, @Request() req: { user: { userId: string } }) {
    return this.glJournalsService.create(dto, req.user.userId);
  }

  @Post(':id/approve')
  @RequirePermissions('finance:gl')
  approve(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.glJournalsService.approve(id, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('finance:gl')
  remove(@Param('id') id: string) {
    return this.glJournalsService.remove(id);
  }
}

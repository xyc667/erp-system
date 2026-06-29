import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { GlAccountsService } from './gl-accounts.service';

@Controller('api/finance/accounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GlAccountsController {
  constructor(private glAccountsService: GlAccountsService) {}

  @Get()
  @RequirePermissions('finance:gl')
  findAll() {
    return this.glAccountsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('finance:gl')
  findById(@Param('id') id: string) {
    return this.glAccountsService.findById(id);
  }

  @Post()
  @RequirePermissions('finance:gl')
  create(@Body() dto: CreateGlAccountDto) {
    return this.glAccountsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance:gl')
  update(@Param('id') id: string, @Body() dto: UpdateGlAccountDto) {
    return this.glAccountsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('finance:gl')
  remove(@Param('id') id: string) {
    return this.glAccountsService.remove(id);
  }
}

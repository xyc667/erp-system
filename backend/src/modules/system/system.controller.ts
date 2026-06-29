import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { CreateDictionaryDto } from './dto/create-dictionary.dto';
import { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import { SystemService } from './system.service';

@Controller('api/system')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('config')
  @RequirePermissions('system:config')
  findAllConfigs() {
    return this.systemService.findAllConfigs();
  }

  @Post('config')
  @RequirePermissions('system:config')
  createConfig(@Body() dto: CreateConfigDto) {
    return this.systemService.createConfig(dto);
  }

  @Patch('config/:id')
  @RequirePermissions('system:config')
  updateConfig(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.systemService.updateConfig(id, dto);
  }

  @Delete('config/:id')
  @RequirePermissions('system:config')
  removeConfig(@Param('id') id: string) {
    return this.systemService.removeConfig(id);
  }

  @Get('dictionaries')
  @RequirePermissions('system:config')
  findAllDictionaries() {
    return this.systemService.findAllDictionaries();
  }

  @Post('dictionaries')
  @RequirePermissions('system:config')
  createDictionary(@Body() dto: CreateDictionaryDto) {
    return this.systemService.createDictionary(dto);
  }

  @Delete('dictionaries/:id')
  @RequirePermissions('system:config')
  removeDictionary(@Param('id') id: string) {
    return this.systemService.removeDictionary(id);
  }

  @Post('dictionaries/:id/items')
  @RequirePermissions('system:config')
  addDictionaryItem(
    @Param('id') id: string,
    @Body() dto: CreateDictionaryItemDto,
  ) {
    return this.systemService.addDictionaryItem(id, dto);
  }

  @Delete('dictionary-items/:id')
  @RequirePermissions('system:config')
  removeDictionaryItem(@Param('id') id: string) {
    return this.systemService.removeDictionaryItem(id);
  }
}

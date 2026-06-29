import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

@Controller('api/procurement/vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  @RequirePermissions('procurement:vendor')
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('procurement:vendor')
  findById(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Post()
  @RequirePermissions('procurement:vendor')
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('procurement:vendor')
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('procurement:vendor')
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }
}

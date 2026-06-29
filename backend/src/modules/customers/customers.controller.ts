import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('api/sales/customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @RequirePermissions('sales:customer')
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('sales:customer')
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @RequirePermissions('sales:customer')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('sales:customer')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('sales:customer')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('api/inventory/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @RequirePermissions('inventory:stock')
  findAll() {
    return this.productsService.findAll();
  }

  @Get('categories/list')
  @RequirePermissions('inventory:stock')
  findCategories() {
    return this.productsService.findCategories();
  }

  @Get(':id')
  @RequirePermissions('inventory:stock')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @RequirePermissions('inventory:stock')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('inventory:stock')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('inventory:stock')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

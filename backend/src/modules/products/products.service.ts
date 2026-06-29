import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  findAll() {
    return this.prisma.product.findMany({
      where: this.tenant.where(),
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, ...this.tenant.where() },
      include: { category: true },
    });
  }

  findCategories() {
    return this.prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
  }

  create(data: CreateProductDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    return this.prisma.product.create({
      data: { ...data, tenantId },
      include: { category: true },
    });
  }

  update(id: string, data: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}

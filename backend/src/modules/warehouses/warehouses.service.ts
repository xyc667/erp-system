import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  findAll() {
    return this.prisma.warehouse.findMany({
      where: this.tenant.where(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.warehouse.findFirst({ where: { id, ...this.tenant.where() } });
  }

  create(data: CreateWarehouseDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    return this.prisma.warehouse.create({ data: { ...data, tenantId } });
  }

  update(id: string, data: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.warehouse.delete({ where: { id } });
  }
}

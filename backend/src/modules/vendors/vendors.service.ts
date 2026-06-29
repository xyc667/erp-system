import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  findAll() {
    return this.prisma.vendor.findMany({
      where: this.tenant.where(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.vendor.findFirst({ where: { id, ...this.tenant.where() } });
  }

  create(data: CreateVendorDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    return this.prisma.vendor.create({ data: { ...data, tenantId } });
  }

  update(id: string, data: UpdateVendorDto) {
    return this.prisma.vendor.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.vendor.delete({ where: { id } });
  }
}

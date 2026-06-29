import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  findAll() {
    return this.prisma.customer.findMany({
      where: this.tenant.where(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.customer.findFirst({ where: { id, ...this.tenant.where() } });
  }

  create(data: CreateCustomerDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    return this.prisma.customer.create({ data: { ...data, tenantId } });
  }

  update(id: string, data: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  findAll() {
    return this.prisma.department.findMany({
      where: this.tenant.where(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.department.findFirst({ where: { id, ...this.tenant.where() } });
  }

  create(data: CreateDepartmentDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    return this.prisma.department.create({ data: { ...data, tenantId } });
  }

  update(id: string, data: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({
      where: { status: 'active' },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    });
  }

  findByCode(code: string) {
    return this.prisma.tenant.findUnique({ where: { code } });
  }

  create(dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        code: dto.code,
        name: dto.name,
        schemaName: dto.schemaName ?? `tenant_${dto.code}`,
      },
    });
  }
}

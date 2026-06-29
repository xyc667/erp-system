import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: this.tenant.where(),
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findByName(name: string) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) return null;
    return this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name } },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async create(createRoleDto: CreateRoleDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    return this.prisma.role.create({
      data: {
        tenantId,
        name: createRoleDto.name,
        description: createRoleDto.description,
      },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });
    
    const permissions = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
    }));
    
    return this.prisma.rolePermission.createMany({
      data: permissions,
    });
  }
}
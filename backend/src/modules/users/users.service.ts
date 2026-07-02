import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeUser } from '../../common/utils/sanitize-user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async findByUsername(username: string, tenantId: string) {
    return this.prisma.user.findUnique({
      where: { tenantId_username: { tenantId, username } },
      include: { role: true, tenant: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return user ? sanitizeUser(user) : null;
  }

  async findWithPassword(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: this.tenant.where(),
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(sanitizeUser);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return user?.role.rolePermissions.map((rp) => rp.permission.code) ?? [];
  }

  async create(createUserDto: CreateUserDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        tenantId,
        password: hashedPassword,
      },
      include: { role: true },
    });
    return sanitizeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    } else {
      delete data.password;
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
    return sanitizeUser(user);
  }

  async updatePreferences(
    id: string,
    data: { timezone?: string; currency?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
    return sanitizeUser(user);
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({
      where: { id },
      include: { role: true },
    });
    return sanitizeUser(user);
  }
}
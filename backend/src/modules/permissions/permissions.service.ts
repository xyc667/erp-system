import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.prisma.permission.findUnique({
      where: { code },
    });
  }

  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module },
      orderBy: { code: 'asc' },
    });
  }

  async create(createPermissionDto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: string) {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
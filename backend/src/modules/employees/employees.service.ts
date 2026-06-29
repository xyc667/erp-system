import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const includeRelations = { department: true, position: true };

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.employee.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        ...dto,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      },
      include: includeRelations,
    });
  }

  update(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      },
      include: includeRelations,
    });
  }

  remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}

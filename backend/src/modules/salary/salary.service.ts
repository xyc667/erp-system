import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.salaryRecord.findMany({
      include: { employee: { include: { department: true } } },
      orderBy: { yearMonth: 'desc' },
    });
  }

  create(dto: CreateSalaryDto) {
    const bonus = dto.bonus || 0;
    const deduction = dto.deduction || 0;
    const netSalary = dto.baseSalary + bonus - deduction;

    return this.prisma.salaryRecord.create({
      data: {
        employeeId: dto.employeeId,
        yearMonth: dto.yearMonth,
        baseSalary: dto.baseSalary,
        bonus,
        deduction,
        netSalary,
      },
      include: { employee: true },
    });
  }

  pay(id: string) {
    return this.prisma.salaryRecord.update({
      where: { id },
      data: { status: 'paid' },
      include: { employee: true },
    });
  }

  remove(id: string) {
    return this.prisma.salaryRecord.delete({ where: { id } });
  }
}

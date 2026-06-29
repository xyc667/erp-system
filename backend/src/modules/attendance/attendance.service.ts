import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.attendance.findMany({
      include: { employee: { include: { department: true } } },
      orderBy: { date: 'desc' },
    });
  }

  create(dto: CreateAttendanceDto) {
    return this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        status: dto.status || 'present',
        remark: dto.remark,
        checkIn: dto.status === 'present' ? new Date() : undefined,
      },
      include: { employee: true },
    });
  }

  async checkOut(id: string) {
    return this.prisma.attendance.update({
      where: { id },
      data: { checkOut: new Date() },
      include: { employee: true },
    });
  }

  remove(id: string) {
    return this.prisma.attendance.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.performanceReview.findMany({
      include: {
        employee: { include: { department: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreatePerformanceDto, reviewerId: string) {
    const grade = dto.grade || this.calcGrade(dto.score);
    return this.prisma.performanceReview.create({
      data: {
        ...dto,
        grade,
        reviewerId,
      },
      include: { employee: true, reviewer: { select: { name: true } } },
    });
  }

  remove(id: string) {
    return this.prisma.performanceReview.delete({ where: { id } });
  }

  private calcGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  }
}

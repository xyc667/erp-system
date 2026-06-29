import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const includeRelations = {
  manager: true,
  createdBy: { select: { id: true, name: true } },
  tasks: { include: { assignee: true } },
};

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        managerId: dto.managerId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
        createdById: userId,
        tasks: dto.tasks?.length ? { create: dto.tasks } : undefined,
      },
      include: includeRelations,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id);
    if (!project) throw new NotFoundException('项目不存在');

    return this.prisma.project.update({
      where: { id },
      data: dto,
      include: includeRelations,
    });
  }

  async activate(id: string) {
    const project = await this.findById(id);
    if (!project) throw new NotFoundException('项目不存在');
    if (project.status !== 'planning') throw new BadRequestException('只能启动规划中的项目');

    return this.prisma.project.update({
      where: { id },
      data: { status: 'active' },
      include: includeRelations,
    });
  }

  async complete(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: 'completed', progress: 100 },
      include: includeRelations,
    });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.position.findMany({ orderBy: { code: 'asc' } });
  }

  create(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: dto });
  }

  update(id: string, dto: UpdatePositionDto) {
    return this.prisma.position.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.position.delete({ where: { id } });
  }
}

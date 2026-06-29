import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { UpdateBomDto } from './dto/update-bom.dto';

const includeRelations = {
  product: true,
  items: { include: { component: true } },
};

@Injectable()
export class BomsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.bom.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.bom.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateBomDto) {
    if (!dto.items?.length) throw new BadRequestException('BOM 明细不能为空');

    return this.prisma.bom.create({
      data: {
        code: dto.code,
        name: dto.name,
        productId: dto.productId,
        version: dto.version || '1.0',
        description: dto.description,
        items: { create: dto.items },
      },
      include: includeRelations,
    });
  }

  async update(id: string, dto: UpdateBomDto) {
    const bom = await this.findById(id);
    if (!bom) throw new NotFoundException('BOM 不存在');

    return this.prisma.bom.update({
      where: { id },
      data: dto,
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const bom = await this.findById(id);
    if (!bom) throw new NotFoundException('BOM 不存在');

    return this.prisma.bom.delete({ where: { id } });
  }
}

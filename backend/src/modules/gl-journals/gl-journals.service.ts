import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreateGlJournalDto } from './dto/create-gl-journal.dto';

const includeRelations = {
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  lines: { include: { account: true } },
};

@Injectable()
export class GlJournalsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.glJournal.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.glJournal.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateGlJournalDto, userId: string) {
    if (!dto.lines?.length) throw new BadRequestException('凭证分录不能为空');

    const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('借贷不平衡');
    }

    const journalNo = await generateOrderNo('JV', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.glJournal.count({
        where: { journalNo: { startsWith: `JV-${date}` } },
      });
    });

    return this.prisma.glJournal.create({
      data: {
        journalNo,
        date: new Date(dto.date),
        type: dto.type,
        createdById: userId,
        lines: {
          create: dto.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
        },
      },
      include: includeRelations,
    });
  }

  async approve(id: string, userId: string) {
    const journal = await this.findById(id);
    if (!journal) throw new NotFoundException('凭证不存在');
    if (journal.status !== 'draft') throw new BadRequestException('只能审批草稿凭证');

    return this.prisma.glJournal.update({
      where: { id },
      data: {
        status: 'posted',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const journal = await this.findById(id);
    if (!journal) throw new NotFoundException('凭证不存在');
    if (journal.status !== 'draft') throw new BadRequestException('只能删除草稿凭证');

    return this.prisma.glJournal.delete({ where: { id } });
  }
}

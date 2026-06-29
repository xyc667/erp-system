import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreateServiceTicketDto, ResolveServiceTicketDto } from './dto/create-service-ticket.dto';

const includeRelations = {
  customer: true,
  salesOrder: { select: { id: true, orderNo: true } },
  createdBy: { select: { id: true, name: true } },
};

@Injectable()
export class ServiceTicketsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceTicket.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.serviceTicket.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateServiceTicketDto, userId: string) {
    const ticketNo = await generateOrderNo('TK', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.serviceTicket.count({
        where: { ticketNo: { startsWith: `TK-${date}` } },
      });
    });

    return this.prisma.serviceTicket.create({
      data: {
        ticketNo,
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId,
        type: dto.type ?? 'repair',
        priority: dto.priority ?? 'normal',
        description: dto.description,
        createdById: userId,
      },
      include: includeRelations,
    });
  }

  async updateStatus(id: string, status: string) {
    const ticket = await this.findById(id);
    if (!ticket) throw new NotFoundException('售后工单不存在');
    if (['closed', 'resolved'].includes(ticket.status)) {
      throw new BadRequestException('工单已关闭');
    }

    return this.prisma.serviceTicket.update({
      where: { id },
      data: { status },
      include: includeRelations,
    });
  }

  async resolve(id: string, dto: ResolveServiceTicketDto) {
    const ticket = await this.findById(id);
    if (!ticket) throw new NotFoundException('售后工单不存在');

    return this.prisma.serviceTicket.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution: dto.resolution,
        resolvedAt: new Date(),
      },
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const ticket = await this.findById(id);
    if (!ticket) throw new NotFoundException('售后工单不存在');
    return this.prisma.serviceTicket.delete({ where: { id } });
  }
}

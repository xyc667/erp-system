import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { InventoryService } from '../inventory/inventory.service';
import { CreateStocktakeDto } from './dto/create-stocktake.dto';

const includeRelations = {
  warehouse: true,
  createdBy: { select: { id: true, name: true } },
  items: { include: { product: true } },
};

@Injectable()
export class StocktakesService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  findAll() {
    return this.prisma.stocktake.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.stocktake.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateStocktakeDto, userId: string) {
    const inventory = await this.prisma.inventory.findMany({
      where: { warehouseId: dto.warehouseId },
    });
    if (!inventory.length) throw new BadRequestException('该仓库暂无库存记录');

    const stocktakeNo = await generateOrderNo('ST', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.stocktake.count({
        where: { stocktakeNo: { startsWith: `ST-${date}` } },
      });
    });

    return this.prisma.stocktake.create({
      data: {
        stocktakeNo,
        warehouseId: dto.warehouseId,
        remark: dto.remark,
        createdById: userId,
        status: 'counting',
        items: {
          create: inventory.map((row) => ({
            productId: row.productId,
            systemQty: row.quantity,
          })),
        },
      },
      include: includeRelations,
    });
  }

  async updateItemCount(stocktakeId: string, itemId: string, countedQty: number) {
    const stocktake = await this.findById(stocktakeId);
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status !== 'counting') throw new BadRequestException('盘点单不在盘点中');

    const item = stocktake.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('盘点明细不存在');

    const difference = countedQty - Number(item.systemQty);

    return this.prisma.stocktakeItem.update({
      where: { id: itemId },
      data: { countedQty, difference },
      include: { product: true },
    });
  }

  async complete(id: string, userId: string) {
    const stocktake = await this.findById(id);
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status !== 'counting') throw new BadRequestException('盘点单不在盘点中');

    const pending = stocktake.items.filter((i) => i.countedQty === null);
    if (pending.length) throw new BadRequestException('请先完成所有产品的实盘数量录入');

    for (const item of stocktake.items) {
      const diff = Number(item.difference ?? 0);
      if (diff !== 0) {
        await this.inventoryService.adjustStock(
          {
            productId: item.productId,
            warehouseId: stocktake.warehouseId,
            quantity: diff,
            type: 'stocktake',
            referenceNo: stocktake.stocktakeNo,
          },
          userId,
        );
      }
    }

    return this.prisma.stocktake.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const stocktake = await this.findById(id);
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status === 'completed') throw new BadRequestException('已完成盘点不可删除');

    return this.prisma.stocktake.delete({ where: { id } });
  }
}

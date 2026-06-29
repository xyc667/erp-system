import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

const includeRelations = {
  product: true,
  warehouse: true,
};

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
    private queue: QueueService,
  ) {}

  findAll() {
    return this.prisma.inventory.findMany({
      include: includeRelations,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.inventory.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  create(data: CreateInventoryDto) {
    return this.prisma.inventory.create({
      data,
      include: includeRelations,
    });
  }

  update(id: string, data: UpdateInventoryDto) {
    return this.prisma.inventory.update({
      where: { id },
      data,
      include: includeRelations,
    });
  }

  remove(id: string) {
    return this.prisma.inventory.delete({ where: { id } });
  }

  findMovements() {
    return this.prisma.stockMovement.findMany({
      include: {
        product: true,
        warehouse: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new BadRequestException('产品不存在');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findFirst({
        where: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          batchNo: dto.batchNo ?? null,
        },
      });

      const delta = Number(dto.quantity);
      if (existing) {
        const newQty = Number(existing.quantity) + delta;
        if (newQty < 0) throw new BadRequestException('库存不足');
        await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        });
      } else {
        if (delta < 0) throw new BadRequestException('库存不足');
        await tx.inventory.create({
          data: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            quantity: delta,
            unit: product.unit,
            batchNo: dto.batchNo,
          },
        });
      }

      return tx.stockMovement.create({
        data: {
          type: dto.type,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: delta,
          batchNo: dto.batchNo,
          serialNo: dto.serialNo,
          referenceNo: dto.referenceNo,
          referenceType: 'manual',
          createdById: userId,
        },
        include: {
          product: true,
          warehouse: true,
          createdBy: { select: { id: true, name: true } },
        },
      });
    }).then(async (movement) => {
      await this.notifyLowStock(dto.productId, userId);
      return movement;
    });
  }

  private async notifyLowStock(productId: string, userId: string) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) return;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { inventory: true },
    });
    if (!product?.safetyStock) return;

    const currentQty = product.inventory.reduce((sum, row) => sum + Number(row.quantity), 0);
    const safetyStock = Number(product.safetyStock);
    if (currentQty >= safetyStock) return;

    await this.queue.publish({
      type: 'stock.alert',
      tenantId,
      userId,
      title: '库存预警',
      message: `${product.name}(${product.code}) 库存 ${currentQty}，低于安全库存 ${safetyStock}`,
      payload: { productId, currentQty, safetyStock },
    });
  }

  async addStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    type: string,
    userId: string,
    reference?: { no?: string; type?: string; id?: string },
  ) {
    return this.adjustStock(
      {
        productId,
        warehouseId,
        quantity,
        type,
        referenceNo: reference?.no,
      },
      userId,
    );
  }

  async reduceStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    type: string,
    userId: string,
    reference?: { no?: string; type?: string; id?: string },
  ) {
    return this.adjustStock(
      {
        productId,
        warehouseId,
        quantity: -quantity,
        type,
        referenceNo: reference?.no,
      },
      userId,
    );
  }

  async transferStock(dto: TransferStockDto, userId: string) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('源仓库与目标仓库不能相同');
    }

    const referenceNo = dto.referenceNo ?? `TR-${Date.now()}`;
    const reference = { no: referenceNo, type: 'transfer' };

    await this.reduceStock(
      dto.productId,
      dto.fromWarehouseId,
      dto.quantity,
      'transfer_out',
      userId,
      reference,
    );

    const movement = await this.addStock(
      dto.productId,
      dto.toWarehouseId,
      dto.quantity,
      'transfer_in',
      userId,
      reference,
    );

    return { referenceNo, movement };
  }

  async findAlerts() {
    const products = await this.prisma.product.findMany({
      where: { safetyStock: { gt: 0 }, ...this.tenant.where() },
      include: {
        inventory: true,
        category: true,
      },
    });

    return products
      .map((product) => {
        const currentQty = product.inventory.reduce(
          (sum, row) => sum + Number(row.quantity),
          0,
        );
        const safetyStock = Number(product.safetyStock ?? 0);
        if (currentQty >= safetyStock) return null;

        return {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit,
          category: product.category?.name ?? null,
          currentQty,
          safetyStock,
          shortage: safetyStock - currentQty,
        };
      })
      .filter(Boolean);
  }
}

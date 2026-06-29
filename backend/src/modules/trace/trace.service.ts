import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterSerialDto } from './dto/register-serial.dto';

@Injectable()
export class TraceService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async traceByBatch(batchNo: string) {
    const tenantWhere = this.tenant.where();
    const inventory = await this.prisma.inventory.findMany({
      where: { batchNo, product: tenantWhere },
      include: { product: true, warehouse: true },
    });
    const movements = await this.prisma.stockMovement.findMany({
      where: { batchNo, product: tenantWhere },
      include: {
        product: true,
        warehouse: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const serials = await this.prisma.serialNumber.findMany({
      where: { batchNo, ...tenantWhere },
      include: { product: true, warehouse: true },
    });
    return { batchNo, inventory, movements, serials };
  }

  async traceBySerial(serialNo: string) {
    const serial = await this.prisma.serialNumber.findFirst({
      where: { serialNo, ...this.tenant.where() },
      include: { product: true, warehouse: true, traces: { include: { warehouse: true, createdBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } } },
    });
    if (!serial) throw new NotFoundException('序列号不存在');

    const movements = await this.prisma.stockMovement.findMany({
      where: { serialNo, product: this.tenant.where() },
      include: { product: true, warehouse: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { serial, movements };
  }

  listSerials() {
    return this.prisma.serialNumber.findMany({
      where: this.tenant.where(),
      include: { product: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async registerSerial(dto: RegisterSerialDto, userId: string) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('产品不存在');

    return this.prisma.$transaction(async (tx) => {
      const serial = await tx.serialNumber.create({
        data: {
          tenantId,
          serialNo: dto.serialNo,
          productId: dto.productId,
          batchNo: dto.batchNo,
          warehouseId: dto.warehouseId,
          status: 'in_stock',
        },
        include: { product: true, warehouse: true },
      });
      await tx.serialTrace.create({
        data: {
          serialId: serial.id,
          action: 'register',
          warehouseId: dto.warehouseId,
          referenceNo: dto.batchNo,
          referenceType: 'batch',
          createdById: userId,
        },
      });
      return serial;
    });
  }
}

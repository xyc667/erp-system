import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BlockchainRpcService } from './blockchain-rpc.service';

@Injectable()
export class BlockchainService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
    private rpc: BlockchainRpcService,
  ) {}

  private hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private async getLastAnchor(tenantId: string) {
    return this.prisma.chainAnchor.findFirst({
      where: { tenantId },
      orderBy: { blockIndex: 'desc' },
    });
  }

  getStatus() {
    return {
      rpcEnabled: this.rpc.isRpcEnabled(),
      network: process.env.BLOCKCHAIN_NETWORK_NAME || null,
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL ? 'configured' : null,
    };
  }

  async anchorBatch(batchNo: string) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new NotFoundException('Tenant not found');

    const inventory = await this.prisma.inventory.findMany({
      where: { batchNo, product: this.tenant.where() },
      include: { product: true, warehouse: true },
    });
    const movements = await this.prisma.stockMovement.findMany({
      where: { batchNo },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: 'asc' },
    });

    if (inventory.length === 0 && movements.length === 0) {
      throw new NotFoundException('Batch not found');
    }

    const payload = {
      batchNo,
      inventory: inventory.map((i) => ({
        productCode: i.product.code,
        warehouse: i.warehouse.name,
        quantity: Number(i.quantity),
      })),
      movements: movements.map((m) => ({
        type: m.type,
        productCode: m.product.code,
        quantity: Number(m.quantity),
        at: m.createdAt.toISOString(),
      })),
    };

    return this.createAnchor(tenantId, 'batch', batchNo, null, payload);
  }

  async verifyBatch(batchNo: string) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new NotFoundException('Tenant not found');

    const anchors = await this.prisma.chainAnchor.findMany({
      where: { tenantId, referenceKey: batchNo, anchorType: 'batch' },
      orderBy: { blockIndex: 'asc' },
    });

    if (anchors.length === 0) {
      return { verified: false, reason: 'not_anchored', anchors: [], rpcEnabled: this.rpc.isRpcEnabled() };
    }

    let prevHash: string | null = null;
    const chainValid = anchors.every((a) => {
      const ok = a.prevHash === prevHash;
      prevHash = a.payloadHash;
      return ok;
    });

    const latest = anchors[anchors.length - 1];
    const inventory = await this.prisma.inventory.findMany({
      where: { batchNo, product: this.tenant.where() },
      include: { product: true, warehouse: true },
    });
    const movements = await this.prisma.stockMovement.findMany({
      where: { batchNo },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: 'asc' },
    });

    const currentPayload = {
      batchNo,
      inventory: inventory.map((i) => ({
        productCode: i.product.code,
        warehouse: i.warehouse.name,
        quantity: Number(i.quantity),
      })),
      movements: movements.map((m) => ({
        type: m.type,
        productCode: m.product.code,
        quantity: Number(m.quantity),
        at: m.createdAt.toISOString(),
      })),
    };

    const currentHash = this.hashPayload(currentPayload);
    const dataIntact = currentHash === latest.payloadHash;

    return {
      verified: chainValid && dataIntact,
      chainValid,
      dataIntact,
      blockCount: anchors.length,
      latestBlock: latest,
      anchors,
      rpcEnabled: this.rpc.isRpcEnabled(),
      onChainTx: latest.txHash,
    };
  }

  listChain(limit = 20) {
    const tenantId = this.tenant.getTenantId();
    return this.prisma.chainAnchor.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { blockIndex: 'desc' },
      take: limit,
    });
  }

  private async createAnchor(
    tenantId: string,
    anchorType: string,
    referenceKey: string,
    referenceId: string | null,
    payload: unknown,
  ) {
    const last = await this.getLastAnchor(tenantId);
    const payloadHash = this.hashPayload(payload);
    const blockIndex = (last?.blockIndex ?? -1) + 1;
    const rpcResult = await this.rpc.submitHash(payloadHash);

    return this.prisma.chainAnchor.create({
      data: {
        tenantId,
        anchorType,
        referenceKey,
        referenceId,
        payloadHash,
        prevHash: last?.payloadHash ?? null,
        blockIndex,
        txHash: rpcResult.txHash,
        network: rpcResult.network,
        chainMode: rpcResult.chainMode,
      },
    });
  }
}

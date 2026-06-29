import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { BlockchainService } from './blockchain.service';

@Controller('api/blockchain')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BlockchainController {
  constructor(private blockchainService: BlockchainService) {}

  @Get('status')
  @RequirePermissions('inventory:trace')
  status() {
    return this.blockchainService.getStatus();
  }

  @Post('anchor/batch/:batchNo')
  @RequirePermissions('inventory:trace')
  anchorBatch(@Param('batchNo') batchNo: string) {
    return this.blockchainService.anchorBatch(batchNo);
  }

  @Get('verify/batch/:batchNo')
  @RequirePermissions('inventory:trace')
  verifyBatch(@Param('batchNo') batchNo: string) {
    return this.blockchainService.verifyBatch(batchNo);
  }

  @Get('chain')
  @RequirePermissions('inventory:trace')
  listChain(@Query('limit') limit?: string) {
    return this.blockchainService.listChain(limit ? Number(limit) : 20);
  }
}

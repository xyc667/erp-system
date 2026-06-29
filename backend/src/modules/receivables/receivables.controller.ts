import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { RecordReceiptDto } from './dto/record-receipt.dto';
import { ReceivablesService } from './receivables.service';

@Controller('api/finance/receivables')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceivablesController {
  constructor(private receivablesService: ReceivablesService) {}

  @Get()
  @RequirePermissions('finance:ar')
  findAll() {
    return this.receivablesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('finance:ar')
  findById(@Param('id') id: string) {
    return this.receivablesService.findById(id);
  }

  @Post(':id/receipt')
  @RequirePermissions('finance:ar')
  recordReceipt(@Param('id') id: string, @Body() dto: RecordReceiptDto) {
    return this.receivablesService.recordReceipt(id, dto);
  }
}

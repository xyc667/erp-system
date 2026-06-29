import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PayablesService } from './payables.service';

@Controller('api/finance/payables')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayablesController {
  constructor(private payablesService: PayablesService) {}

  @Get()
  @RequirePermissions('finance:ap')
  findAll() {
    return this.payablesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('finance:ap')
  findById(@Param('id') id: string) {
    return this.payablesService.findById(id);
  }

  @Post(':id/payment')
  @RequirePermissions('finance:ap')
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.payablesService.recordPayment(id, dto);
  }
}

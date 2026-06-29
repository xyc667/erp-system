import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { IntegrationService } from './integration.service';

@Controller('api/integration')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntegrationController {
  constructor(private integrationService: IntegrationService) {}

  @Get('master-data')
  @RequirePermissions('integration:sync')
  exportMasterData() {
    return this.integrationService.exportMasterData();
  }

  @Get('orders')
  @RequirePermissions('integration:sync')
  exportOrders(@Query('type') type?: 'sales' | 'purchase') {
    return this.integrationService.exportOrders(type);
  }

  @Get('inventory')
  @RequirePermissions('integration:sync')
  exportInventory() {
    return this.integrationService.exportInventory();
  }
}

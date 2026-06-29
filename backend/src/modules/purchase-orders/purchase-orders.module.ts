import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PayablesModule } from '../payables/payables.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule, PayablesModule, BudgetsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}

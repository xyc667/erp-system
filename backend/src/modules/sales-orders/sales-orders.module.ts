import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReceivablesModule } from '../receivables/receivables.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule, ReceivablesModule],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
})
export class SalesOrdersModule {}

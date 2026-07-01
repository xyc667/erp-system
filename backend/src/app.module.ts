import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TenantModule } from './common/tenant/tenant.module';
import { CacheModule } from './modules/cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { SystemModule } from './modules/system/system.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { GlAccountsModule } from './modules/gl-accounts/gl-accounts.module';
import { GlJournalsModule } from './modules/gl-journals/gl-journals.module';
import { BomsModule } from './modules/boms/boms.module';
import { ProductionPlansModule } from './modules/production-plans/production-plans.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { QualityInspectionsModule } from './modules/quality-inspections/quality-inspections.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PositionsModule } from './modules/positions/positions.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { SalaryModule } from './modules/salary/salary.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReportModule } from './modules/report/report.module';
import { HealthModule } from './modules/health/health.module';
import { PurchaseRequestsModule } from './modules/purchase-requests/purchase-requests.module';
import { SalesQuotesModule } from './modules/sales-quotes/sales-quotes.module';
import { ReceivablesModule } from './modules/receivables/receivables.module';
import { PayablesModule } from './modules/payables/payables.module';
import { FixedAssetsModule } from './modules/fixed-assets/fixed-assets.module';
import { StocktakesModule } from './modules/stocktakes/stocktakes.module';
import { ServiceTicketsModule } from './modules/service-tickets/service-tickets.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { AuditModule } from './modules/audit/audit.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TraceModule } from './modules/trace/trace.module';
import { StorageModule } from './modules/storage/storage.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AppModule as MobileAppModule } from './modules/app/app.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 10,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    CacheModule,
    QueueModule,
    TenantModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    VendorsModule,
    CustomersModule,
    ProductsModule,
    WarehousesModule,
    DepartmentsModule,
    SystemModule,
    InventoryModule,
    PurchaseOrdersModule,
    SalesOrdersModule,
    GlAccountsModule,
    GlJournalsModule,
    BomsModule,
    ProductionPlansModule,
    WorkOrdersModule,
    QualityInspectionsModule,
    EmployeesModule,
    PositionsModule,
    AttendanceModule,
    SalaryModule,
    PerformanceModule,
    ProjectsModule,
    ReportModule,
    HealthModule,
    PurchaseRequestsModule,
    SalesQuotesModule,
    ReceivablesModule,
    PayablesModule,
    FixedAssetsModule,
    StocktakesModule,
    ServiceTicketsModule,
    IntegrationModule,
    AuditModule,
    TenantsModule,
    BudgetsModule,
    NotificationsModule,
    TraceModule,
    StorageModule,
    IntelligenceModule,
    BlockchainModule,
    LeadsModule,
    MobileAppModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
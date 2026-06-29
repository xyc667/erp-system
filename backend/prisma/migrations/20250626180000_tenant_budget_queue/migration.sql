-- Default tenant for existing data
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "schema_name" VARCHAR(100) NOT NULL DEFAULT 'public',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

INSERT INTO "tenants" ("id", "code", "name", "schema_name", "status", "updated_at")
VALUES ('a0000000-0000-4000-8000-000000000001', 'default', '默认租户', 'public', 'active', CURRENT_TIMESTAMP);

-- Tenant columns on core tables
ALTER TABLE "users" ADD COLUMN "tenant_id" TEXT;
UPDATE "users" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "roles" ADD COLUMN "tenant_id" TEXT;
UPDATE "roles" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "roles" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "vendors" ADD COLUMN "tenant_id" TEXT;
UPDATE "vendors" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "vendors" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "customers" ADD COLUMN "tenant_id" TEXT;
UPDATE "customers" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "customers" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "products" ADD COLUMN "tenant_id" TEXT;
UPDATE "products" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "products" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "products" ADD COLUMN "track_serial" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "warehouses" ADD COLUMN "tenant_id" TEXT;
UPDATE "warehouses" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "warehouses" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "departments" ADD COLUMN "tenant_id" TEXT;
UPDATE "departments" SET "tenant_id" = 'a0000000-0000-4000-8000-000000000001';
ALTER TABLE "departments" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Drop old unique constraints
DROP INDEX IF EXISTS "users_username_key";
DROP INDEX IF EXISTS "users_email_key";
DROP INDEX IF EXISTS "roles_name_key";
DROP INDEX IF EXISTS "vendors_code_key";
DROP INDEX IF EXISTS "customers_code_key";
DROP INDEX IF EXISTS "products_code_key";
DROP INDEX IF EXISTS "warehouses_code_key";
DROP INDEX IF EXISTS "departments_code_key";

-- Composite unique constraints
CREATE UNIQUE INDEX "users_tenant_id_username_key" ON "users"("tenant_id", "username");
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");
CREATE UNIQUE INDEX "vendors_tenant_id_code_key" ON "vendors"("tenant_id", "code");
CREATE UNIQUE INDEX "customers_tenant_id_code_key" ON "customers"("tenant_id", "code");
CREATE UNIQUE INDEX "products_tenant_id_code_key" ON "products"("tenant_id", "code");
CREATE UNIQUE INDEX "warehouses_tenant_id_code_key" ON "warehouses"("tenant_id", "code");
CREATE UNIQUE INDEX "departments_tenant_id_code_key" ON "departments"("tenant_id", "code");

-- Foreign keys
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stock movement batch/serial
ALTER TABLE "stock_movements" ADD COLUMN "batch_no" VARCHAR(50);
ALTER TABLE "stock_movements" ADD COLUMN "serial_no" VARCHAR(100);

-- Budget tables
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "year" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "department_id" TEXT,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "used_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "budgets_tenant_id_code_key" ON "budgets"("tenant_id", "code");
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "budget_usages" (
    "id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" TEXT,
    "reference_no" VARCHAR(50),
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_usages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "budget_usages" ADD CONSTRAINT "budget_usages_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_tenant_id_user_id_read_idx" ON "notifications"("tenant_id", "user_id", "read");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Serial numbers & traces
CREATE TABLE "serial_numbers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "serial_no" VARCHAR(100) NOT NULL,
    "product_id" TEXT NOT NULL,
    "batch_no" VARCHAR(50),
    "warehouse_id" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_stock',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serial_numbers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "serial_numbers_tenant_id_serial_no_key" ON "serial_numbers"("tenant_id", "serial_no");
CREATE INDEX "serial_numbers_batch_no_idx" ON "serial_numbers"("batch_no");
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "serial_traces" (
    "id" TEXT NOT NULL,
    "serial_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "warehouse_id" TEXT,
    "reference_no" VARCHAR(50),
    "reference_type" VARCHAR(50),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serial_traces_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "serial_traces" ADD CONSTRAINT "serial_traces_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "serial_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "serial_traces" ADD CONSTRAINT "serial_traces_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "serial_traces" ADD CONSTRAINT "serial_traces_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" TEXT NOT NULL,
    "asset_no" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50),
    "original_value" DECIMAL(18,2) NOT NULL,
    "accumulated_depreciation" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "useful_life_months" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocktakes" (
    "id" TEXT NOT NULL,
    "stocktake_no" VARCHAR(50) NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "remark" VARCHAR(500),
    "created_by_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocktakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocktake_items" (
    "id" TEXT NOT NULL,
    "stocktake_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "system_qty" DECIMAL(18,4) NOT NULL,
    "counted_qty" DECIMAL(18,4),
    "difference" DECIMAL(18,4),

    CONSTRAINT "stocktake_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_tickets" (
    "id" TEXT NOT NULL,
    "ticket_no" VARCHAR(50) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sales_order_id" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'repair',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "created_by_id" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_asset_no_key" ON "fixed_assets"("asset_no");
CREATE UNIQUE INDEX "stocktakes_stocktake_no_key" ON "stocktakes"("stocktake_no");
CREATE UNIQUE INDEX "service_tickets_ticket_no_key" ON "service_tickets"("ticket_no");

-- AddForeignKey
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_stocktake_id_fkey" FOREIGN KEY ("stocktake_id") REFERENCES "stocktakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

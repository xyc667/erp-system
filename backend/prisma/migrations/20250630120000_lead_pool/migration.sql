-- CreateTable
CREATE TABLE "lead_pool" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50),
    "phone_backup" VARCHAR(50),
    "address" VARCHAR(500),
    "district" VARCHAR(50),
    "category" VARCHAR(50),
    "poi_category_raw" VARCHAR(200),
    "lng" DECIMAL(12,8),
    "lat" DECIMAL(12,8),
    "source" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pool',
    "quality" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "owner_user_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "expire_at" TIMESTAMP(3),
    "follow_up_count" INTEGER NOT NULL DEFAULT 0,
    "last_follow_at" TIMESTAMP(3),
    "dedup_key" VARCHAR(64) NOT NULL,
    "converted_customer_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "invalid_reason" VARCHAR(255),
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_follow_ups" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "next_action_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_pool_tenant_id_dedup_key_key" ON "lead_pool"("tenant_id", "dedup_key");

-- CreateIndex
CREATE INDEX "lead_pool_tenant_id_status_district_category_idx" ON "lead_pool"("tenant_id", "status", "district", "category");

-- CreateIndex
CREATE INDEX "lead_pool_tenant_id_owner_user_id_status_idx" ON "lead_pool"("tenant_id", "owner_user_id", "status");

-- CreateIndex
CREATE INDEX "lead_follow_ups_lead_id_idx" ON "lead_follow_ups"("lead_id");

-- AddForeignKey
ALTER TABLE "lead_pool" ADD CONSTRAINT "lead_pool_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_pool" ADD CONSTRAINT "lead_pool_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_pool" ADD CONSTRAINT "lead_pool_converted_customer_id_fkey" FOREIGN KEY ("converted_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead_pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

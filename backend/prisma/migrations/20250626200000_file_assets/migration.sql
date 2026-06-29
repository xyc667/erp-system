CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bucket" VARCHAR(100) NOT NULL,
    "object_key" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100),
    "size" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "file_assets_tenant_id_idx" ON "file_assets"("tenant_id");
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

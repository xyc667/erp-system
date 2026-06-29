-- Chain anchors for tamper-evident batch/movement trace
CREATE TABLE "chain_anchors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "anchor_type" VARCHAR(30) NOT NULL,
    "reference_key" VARCHAR(100) NOT NULL,
    "reference_id" TEXT,
    "payload_hash" VARCHAR(64) NOT NULL,
    "prev_hash" VARCHAR(64),
    "block_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_anchors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chain_anchors_tenant_id_reference_key_idx" ON "chain_anchors"("tenant_id", "reference_key");

ALTER TABLE "chain_anchors" ADD CONSTRAINT "chain_anchors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

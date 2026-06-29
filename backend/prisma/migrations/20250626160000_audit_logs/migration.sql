-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100),
    "resource_id" TEXT,
    "user_id" TEXT,
    "username" VARCHAR(50),
    "role" VARCHAR(50),
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "result" VARCHAR(20) NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "audit_logs"("category");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

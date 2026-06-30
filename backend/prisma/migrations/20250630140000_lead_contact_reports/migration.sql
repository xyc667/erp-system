-- AlterTable
ALTER TABLE "lead_follow_ups" ADD COLUMN "result" VARCHAR(30),
ADD COLUMN "is_report" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recording_file_id" TEXT,
ADD COLUMN "review_status" VARCHAR(20),
ADD COLUMN "reviewed_by_id" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP(3),
ADD COLUMN "review_comment" TEXT;

-- CreateIndex
CREATE INDEX "lead_follow_ups_is_report_review_status_idx" ON "lead_follow_ups"("is_report", "review_status");

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_recording_file_id_fkey" FOREIGN KEY ("recording_file_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

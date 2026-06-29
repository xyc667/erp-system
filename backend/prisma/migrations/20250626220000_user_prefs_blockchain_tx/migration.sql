-- User regional preferences + blockchain tx metadata
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'CNY';

ALTER TABLE "chain_anchors" ADD COLUMN IF NOT EXISTS "tx_hash" VARCHAR(100);
ALTER TABLE "chain_anchors" ADD COLUMN IF NOT EXISTS "network" VARCHAR(50);
ALTER TABLE "chain_anchors" ADD COLUMN IF NOT EXISTS "chain_mode" VARCHAR(20) NOT NULL DEFAULT 'local';

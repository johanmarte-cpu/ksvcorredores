-- AlterTable: add ITBIS (16%) and total amount columns to policies
ALTER TABLE "policies" ADD COLUMN "itbisAmount" DECIMAL(12,2);
ALTER TABLE "policies" ADD COLUMN "totalAmount" DECIMAL(12,2);

-- Backfill existing rows from their current premium
UPDATE "policies" SET "itbisAmount" = ROUND(premium * 0.16, 2), "totalAmount" = ROUND(premium * 1.16, 2);

-- Enforce NOT NULL now that every row has a value
ALTER TABLE "policies" ALTER COLUMN "itbisAmount" SET NOT NULL;
ALTER TABLE "policies" ALTER COLUMN "totalAmount" SET NOT NULL;

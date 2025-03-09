/*
  Warnings:

  - Added the required column `merchant_id` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add the merchant_id column as nullable
ALTER TABLE "transactions" ADD COLUMN "merchant_id" TEXT;

-- Step 2: Update existing records
-- For each transaction, set merchant_id to the merchant's user_id based on the coupon's merchant
UPDATE "transactions" t
SET "merchant_id" = ct."merchant_id"
FROM "coupon_templates" ct
WHERE t."coupon_id" = ct."id";

-- For transactions without coupon_id, set merchant_id to user_id (temporary solution)
UPDATE "transactions"
SET "merchant_id" = "user_id"
WHERE "merchant_id" IS NULL;

-- Step 3: Make the column required
ALTER TABLE "transactions" ALTER COLUMN "merchant_id" SET NOT NULL;

-- Step 4: Add the foreign key constraint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

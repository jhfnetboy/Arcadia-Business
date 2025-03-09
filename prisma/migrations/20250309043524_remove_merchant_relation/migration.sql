-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_merchant_id_fkey";

-- The merchantId column and its values will be kept, but it will no longer have a foreign key constraint

/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `coupon_categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `promotion_type` to the `coupon_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settings` to the `coupon_templates` table without a default value. This is not possible if the table is not empty.
  - Made the column `discount_value` on table `coupon_templates` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "coupon_templates" ADD COLUMN     "promotion_type" TEXT NOT NULL,
ADD COLUMN     "settings" JSONB NOT NULL,
ALTER COLUMN "discount_value" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "coupon_categories_name_key" ON "coupon_categories"("name");

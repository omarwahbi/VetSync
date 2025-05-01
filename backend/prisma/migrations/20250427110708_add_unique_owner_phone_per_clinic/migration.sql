/*
  Warnings:

  - A unique constraint covering the columns `[clinicId,phone]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Owner" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Owner_clinicId_phone_key" ON "Owner"("clinicId", "phone");

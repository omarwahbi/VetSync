-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE INDEX "Clinic_updatedById_idx" ON "Clinic"("updatedById");

-- CreateIndex
CREATE INDEX "Owner_createdById_idx" ON "Owner"("createdById");

-- CreateIndex
CREATE INDEX "Owner_updatedById_idx" ON "Owner"("updatedById");

-- CreateIndex
CREATE INDEX "Pet_createdById_idx" ON "Pet"("createdById");

-- CreateIndex
CREATE INDEX "Pet_updatedById_idx" ON "Pet"("updatedById");

-- CreateIndex
CREATE INDEX "Visit_createdById_idx" ON "Visit"("createdById");

-- CreateIndex
CREATE INDEX "Visit_updatedById_idx" ON "Visit"("updatedById");

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

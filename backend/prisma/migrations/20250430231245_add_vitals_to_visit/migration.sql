-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "heartRate" INTEGER,
ADD COLUMN     "respiratoryRate" INTEGER,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "weightUnit" TEXT DEFAULT 'kg';

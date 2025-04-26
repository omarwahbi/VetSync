-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "currentCycleStartDate" TIMESTAMP(3),
ADD COLUMN     "reminderMonthlyLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderSentThisCycle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3);

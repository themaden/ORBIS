-- AlterTable
ALTER TABLE "Airport" ADD COLUMN     "gateCount" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "terminals" TEXT;

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "gate" TEXT;

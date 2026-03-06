-- CreateEnum
CREATE TYPE "ReleaseAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ITEMS_ADDED', 'ITEMS_REMOVED', 'RISK_UPDATED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'ROLLBACK');

-- AlterTable
ALTER TABLE "releases" ADD COLUMN     "aiRiskAnalysis" JSONB,
ADD COLUMN     "aiRiskScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "release_logs" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "action" "ReleaseAction" NOT NULL,
    "description" TEXT,
    "snapshot" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "release_logs" ADD CONSTRAINT "release_logs_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_logs" ADD CONSTRAINT "release_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

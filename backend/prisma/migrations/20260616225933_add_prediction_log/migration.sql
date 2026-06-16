-- CreateTable
CREATE TABLE "PredictionLog" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "predictedDelayMin" INTEGER NOT NULL,
    "delayProbability" DOUBLE PRECISION NOT NULL,
    "band" TEXT NOT NULL,
    "actualDelayMin" INTEGER,
    "absError" INTEGER,
    "correct30" BOOLEAN,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictionLog_flightId_idx" ON "PredictionLog"("flightId");

-- CreateIndex
CREATE INDEX "PredictionLog_createdAt_idx" ON "PredictionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PredictionLog" ADD CONSTRAINT "PredictionLog_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

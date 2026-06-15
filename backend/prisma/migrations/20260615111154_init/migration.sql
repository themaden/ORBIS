-- CreateEnum
CREATE TYPE "FlightStatus" AS ENUM ('PLANNED', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED', 'BOARDING');

-- CreateEnum
CREATE TYPE "TicketClass" AS ENUM ('ECONOMY', 'BUSINESS');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('NONE', 'CLASSIC', 'ELITE', 'ELITE_PLUS');

-- CreateEnum
CREATE TYPE "SpecialNeed" AS ENUM ('NONE', 'UM', 'WCHR', 'MEDICAL', 'VIP');

-- CreateEnum
CREATE TYPE "DisruptionType" AS ENUM ('WEATHER', 'TECHNICAL', 'CREW', 'AIRPORT');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SUGGESTED', 'ACCEPTED', 'APPLIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('MEAL', 'HOTEL', 'TRANSFER', 'REFUND', 'COMPENSATION');

-- CreateEnum
CREATE TYPE "CareStatus" AS ENUM ('SUGGESTED', 'APPROVED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('IOCC', 'PASSENGER_CARE', 'HUB_CONTROL', 'ADMIN');

-- CreateTable
CREATE TABLE "Airport" (
    "id" TEXT NOT NULL,
    "iata" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "isHub" BOOLEAN NOT NULL DEFAULT false,
    "mctMin" INTEGER NOT NULL DEFAULT 45,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL,
    "tail" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "economySeats" INTEGER NOT NULL,
    "businessSeats" INTEGER NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "flightNo" TEXT NOT NULL,
    "depAirportId" TEXT NOT NULL,
    "arrAirportId" TEXT NOT NULL,
    "scheduledDep" TIMESTAMP(3) NOT NULL,
    "scheduledArr" TIMESTAMP(3) NOT NULL,
    "estimatedDep" TIMESTAMP(3),
    "estimatedArr" TIMESTAMP(3),
    "status" "FlightStatus" NOT NULL DEFAULT 'PLANNED',
    "delayMin" INTEGER NOT NULL DEFAULT 0,
    "aircraftId" TEXT,
    "economyCap" INTEGER NOT NULL DEFAULT 150,
    "businessCap" INTEGER NOT NULL DEFAULT 20,
    "economyBooked" INTEGER NOT NULL DEFAULT 0,
    "businessBooked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "ticketClass" "TicketClass" NOT NULL DEFAULT 'ECONOMY',
    "loyalty" "LoyaltyTier" NOT NULL DEFAULT 'NONE',
    "specialNeed" "SpecialNeed" NOT NULL DEFAULT 'NONE',
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "seat" TEXT,
    "segmentOrder" INTEGER NOT NULL DEFAULT 1,
    "isConnection" BOOLEAN NOT NULL DEFAULT false,
    "actMin" INTEGER,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disruption" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "type" "DisruptionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Disruption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebookingProposal" (
    "id" TEXT NOT NULL,
    "disruptionId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "fromFlightId" TEXT NOT NULL,
    "toFlightId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "addedDelayMin" INTEGER NOT NULL DEFAULT 0,
    "rationale" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RebookingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareAction" (
    "id" TEXT NOT NULL,
    "disruptionId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "type" "CareType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "status" "CareStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostParam" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "CostParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sicil" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'IOCC',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Airport_iata_key" ON "Airport"("iata");

-- CreateIndex
CREATE UNIQUE INDEX "Aircraft_tail_key" ON "Aircraft"("tail");

-- CreateIndex
CREATE INDEX "Flight_status_idx" ON "Flight"("status");

-- CreateIndex
CREATE INDEX "Flight_scheduledDep_idx" ON "Flight"("scheduledDep");

-- CreateIndex
CREATE INDEX "Booking_pnr_idx" ON "Booking"("pnr");

-- CreateIndex
CREATE INDEX "Booking_flightId_idx" ON "Booking"("flightId");

-- CreateIndex
CREATE INDEX "Disruption_resolved_idx" ON "Disruption"("resolved");

-- CreateIndex
CREATE INDEX "RebookingProposal_disruptionId_idx" ON "RebookingProposal"("disruptionId");

-- CreateIndex
CREATE INDEX "RebookingProposal_passengerId_idx" ON "RebookingProposal"("passengerId");

-- CreateIndex
CREATE UNIQUE INDEX "CostParam_key_key" ON "CostParam"("key");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_sicil_key" ON "User"("sicil");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_depAirportId_fkey" FOREIGN KEY ("depAirportId") REFERENCES "Airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_arrAirportId_fkey" FOREIGN KEY ("arrAirportId") REFERENCES "Airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disruption" ADD CONSTRAINT "Disruption_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebookingProposal" ADD CONSTRAINT "RebookingProposal_disruptionId_fkey" FOREIGN KEY ("disruptionId") REFERENCES "Disruption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebookingProposal" ADD CONSTRAINT "RebookingProposal_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebookingProposal" ADD CONSTRAINT "RebookingProposal_fromFlightId_fkey" FOREIGN KEY ("fromFlightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebookingProposal" ADD CONSTRAINT "RebookingProposal_toFlightId_fkey" FOREIGN KEY ("toFlightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAction" ADD CONSTRAINT "CareAction_disruptionId_fkey" FOREIGN KEY ("disruptionId") REFERENCES "Disruption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAction" ADD CONSTRAINT "CareAction_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

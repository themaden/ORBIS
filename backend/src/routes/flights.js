import { Router } from "express";
import { prisma } from "../db.js";

export const flightsRouter = Router();

const include = { depAirport: true, arrAirport: true, aircraft: true };

// GET /api/flights  — tüm uçuşlar (durum filtresi opsiyonel: ?status=CANCELLED)
flightsRouter.get("/", async (req, res) => {
  const { status } = req.query;
  const flights = await prisma.flight.findMany({
    where: status ? { status } : undefined,
    include,
    orderBy: { scheduledDep: "asc" },
  });
  res.json(flights);
});

// GET /api/flights/:id
flightsRouter.get("/:id", async (req, res) => {
  const flight = await prisma.flight.findUnique({
    where: { id: req.params.id },
    include: { ...include, bookings: { include: { passenger: true } } },
  });
  if (!flight) return res.status(404).json({ error: "Uçuş bulunamadı" });
  res.json(flight);
});

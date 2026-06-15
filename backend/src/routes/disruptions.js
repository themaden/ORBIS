import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { recommendForDisruption } from "../services/recommend.js";

export const disruptionsRouter = Router();

// GET /api/disruptions  — açık/çözülmüş tüm IRROPS olayları
disruptionsRouter.get("/", async (_req, res) => {
  const items = await prisma.disruption.findMany({
    include: { flight: { include: { depAirport: true, arrAirport: true } } },
    orderBy: { startedAt: "desc" },
  });
  res.json(items);
});

// POST /api/disruptions  { flightId, type, reason }  — yeni IRROPS olayı (uçuşu iptal işaretler)
disruptionsRouter.post("/", requireAuth, async (req, res) => {
  const { flightId, type = "WEATHER", reason = "Operasyonel aksaklık" } = req.body || {};
  if (!flightId) return res.status(400).json({ error: "flightId gerekli" });

  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return res.status(404).json({ error: "Uçuş bulunamadı" });

  await prisma.flight.update({ where: { id: flightId }, data: { status: "CANCELLED" } });
  const disruption = await prisma.disruption.create({
    data: { flightId, type, reason },
    include: { flight: { include: { depAirport: true, arrAirport: true } } },
  });
  res.status(201).json(disruption);
});

// GET /api/disruptions/:id/passengers — etkilenen yolcular (öncelik özetiyle)
disruptionsRouter.get("/:id/passengers", async (req, res) => {
  const disruption = await prisma.disruption.findUnique({
    where: { id: req.params.id },
    include: { flight: true },
  });
  if (!disruption) return res.status(404).json({ error: "Olay bulunamadı" });

  const bookings = await prisma.booking.findMany({
    where: { flightId: disruption.flightId },
    include: { passenger: true, flight: { include: { arrAirport: true } } },
  });

  // Her yolcunun bağlantılı segmenti var mı?
  const passengers = await Promise.all(
    bookings.map(async (b) => {
      const connection = await prisma.booking.findFirst({
        where: { pnr: b.pnr, isConnection: true },
        include: { flight: { include: { arrAirport: true } } },
      });
      return {
        passengerId: b.passenger.id,
        pnr: b.pnr,
        fullName: b.passenger.fullName,
        ticketClass: b.passenger.ticketClass,
        loyalty: b.passenger.loyalty,
        specialNeed: b.passenger.specialNeed,
        seat: b.seat,
        hasConnection: !!connection,
        connectionFlight: connection?.flight?.flightNo ?? null,
        actMin: connection?.actMin ?? null,
      };
    })
  );

  res.json({
    disruptionId: disruption.id,
    flightNo: disruption.flight.flightNo,
    affectedCount: passengers.length,
    passengers,
  });
});

// POST /api/disruptions/:id/recommend — öneri motorunu çalıştır (kaydeder + döner)
disruptionsRouter.post("/:id/recommend", requireAuth, async (req, res) => {
  const out = await recommendForDisruption(req.params.id);
  res.json(out);
});

// POST /api/disruptions/:id/apply — bir öneriyi uygula (yolcuyu yeni uçuşa taşı)
// body: { passengerId, toFlightId }
disruptionsRouter.post("/:id/apply", requireAuth, async (req, res) => {
  const disruptionId = req.params.id;
  const { passengerId, toFlightId } = req.body || {};
  if (!passengerId || !toFlightId)
    return res.status(400).json({ error: "passengerId ve toFlightId gerekli" });

  const disruption = await prisma.disruption.findUnique({ where: { id: disruptionId } });
  if (!disruption) return res.status(404).json({ error: "Olay bulunamadı" });

  const passenger = await prisma.passenger.findUnique({ where: { id: passengerId } });
  if (!passenger) return res.status(404).json({ error: "Yolcu bulunamadı" });

  // Yolcunun iptal uçuştaki ana segmenti
  const booking = await prisma.booking.findFirst({
    where: { passengerId, flightId: disruption.flightId, segmentOrder: 1 },
  });
  if (!booking) return res.status(404).json({ error: "İlgili rezervasyon yok" });

  const isBusiness = passenger.ticketClass === "BUSINESS";

  await prisma.$transaction([
    // bileti yeni uçuşa taşı
    prisma.booking.update({ where: { id: booking.id }, data: { flightId: toFlightId } }),
    // yeni uçuşta koltuğu doldur
    prisma.flight.update({
      where: { id: toFlightId },
      data: isBusiness ? { businessBooked: { increment: 1 } } : { economyBooked: { increment: 1 } },
    }),
    // bu öneriyi uygulandı işaretle
    prisma.rebookingProposal.updateMany({
      where: { disruptionId, passengerId, toFlightId },
      data: { status: "APPLIED" },
    }),
    // diğer önerileri reddet
    prisma.rebookingProposal.updateMany({
      where: { disruptionId, passengerId, toFlightId: { not: toFlightId } },
      data: { status: "REJECTED" },
    }),
    // care aksiyonunu onayla
    prisma.careAction.updateMany({
      where: { disruptionId, passengerId },
      data: { status: "APPROVED" },
    }),
    prisma.auditLog.create({
      data: {
        actor: req.user?.name || "bilinmeyen",
        action: "proposal.apply",
        entity: `Disruption:${disruptionId}`,
        meta: { passengerId, toFlightId },
      },
    }),
  ]);

  res.json({ ok: true, passengerId, toFlightId });
});

// GET /api/disruptions/:id/proposals — kayıtlı öneriler (yolcu + uçuş bilgisiyle)
disruptionsRouter.get("/:id/proposals", async (req, res) => {
  const proposals = await prisma.rebookingProposal.findMany({
    where: { disruptionId: req.params.id },
    include: { passenger: true, toFlight: true },
    orderBy: [{ score: "desc" }, { rank: "asc" }],
  });
  const care = await prisma.careAction.findMany({
    where: { disruptionId: req.params.id },
    include: { passenger: true },
  });
  res.json({ proposals, care });
});

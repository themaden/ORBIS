import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { recommendForDisruption, haversineKm, eu261PerPax, estimatedTicketPrice } from "../services/recommend.js";
import { generateBriefing } from "../services/briefing.js";
import { AuthRequest } from "../types.js";

export const disruptionsRouter = Router();

const CreateBody = z.object({
  flightId: z.string().min(1, "flightId zorunlu"),
  type: z.enum(["WEATHER", "TECHNICAL", "CREW", "AIRPORT"]).optional(),
  reason: z.string().max(500).optional(),
});

const ApplyBody = z.object({
  passengerId: z.string().min(1, "passengerId zorunlu"),
  toFlightId: z.string().min(1, "toFlightId zorunlu"),
});

// GET /api/disruptions  — açık/çözülmüş tüm IRROPS olayları
disruptionsRouter.get("/", async (_req: Request, res: Response) => {
  const items = await prisma.disruption.findMany({
    include: { flight: { include: { depAirport: true, arrAirport: true } } },
    orderBy: { startedAt: "desc" },
  });
  res.json(items);
});

// POST /api/disruptions  { flightId, type, reason }  — yeni IRROPS olayı (uçuşu iptal işaretler)
disruptionsRouter.post(
  "/",
  requireAuth,
  requireRole("IOCC", "HUB_CONTROL"),
  validate(CreateBody),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { flightId, type = "WEATHER", reason = "Operasyonel aksaklık" } = req.body as any;
    const flight = await prisma.flight.findUnique({ where: { id: flightId } });
    if (!flight) {
      res.status(404).json({ error: "Uçuş bulunamadı" });
      return;
    }

    await prisma.flight.update({ where: { id: flightId }, data: { status: "CANCELLED" } });
    const disruption = await prisma.disruption.create({
      data: { flightId, type, reason },
      include: { flight: { include: { depAirport: true, arrAirport: true } } },
    });
    (req.app as any).get("io")?.emit("disruption", disruption);
    res.status(201).json(disruption);
  }
);

// GET /api/disruptions/:id/passengers — etkilenen yolcular (öncelik özetiyle)
disruptionsRouter.get("/:id/passengers", async (req: Request, res: Response): Promise<void> => {
  const disruption = await prisma.disruption.findUnique({
    where: { id: req.params.id },
    include: { flight: true },
  });
  if (!disruption) {
    res.status(404).json({ error: "Olay bulunamadı" });
    return;
  }

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
        connectionFlight: (connection as any)?.flight?.flightNo ?? null,
        actMin: (connection as any)?.actMin ?? null,
      };
    })
  );

  res.json({
    disruptionId: disruption.id,
    flightNo: (disruption.flight as any).flightNo,
    affectedCount: passengers.length,
    passengers,
  });
});

// POST /api/disruptions/:id/recommend — öneri motorunu çalıştır (kaydeder + döner)
disruptionsRouter.post("/:id/recommend", requireAuth, async (req: AuthRequest, res: Response) => {
  const out = await recommendForDisruption(req.params.id);
  const brief = await generateBriefing(out);
  res.json({ ...out, briefing: brief.briefing, briefingSource: brief.source });
});

// POST /api/disruptions/:id/apply — bir öneriyi uygula (yolcuyu yeni uçuşa taşı)
// body: { passengerId, toFlightId }
disruptionsRouter.post(
  "/:id/apply",
  requireAuth,
  validate(ApplyBody),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const disruptionId = req.params.id;
    const { passengerId, toFlightId } = req.body as any;
    const disruption = await prisma.disruption.findUnique({ where: { id: disruptionId } });
    if (!disruption) {
      res.status(404).json({ error: "Olay bulunamadı" });
      return;
    }

    const passenger = await prisma.passenger.findUnique({ where: { id: passengerId } });
    if (!passenger) {
      res.status(404).json({ error: "Yolcu bulunamadı" });
      return;
    }

    // Yolcunun iptal uçuştaki ana segmenti
    const booking = await prisma.booking.findFirst({
      where: { passengerId, flightId: disruption.flightId, segmentOrder: 1 },
    });
    if (!booking) {
      res.status(404).json({ error: "İlgili rezervasyon yok" });
      return;
    }

    const isBusiness = (passenger as any).ticketClass === "BUSINESS";

    await prisma.$transaction([
      // bileti yeni uçuşa taşı
      prisma.booking.update({ where: { id: booking.id }, data: { flightId: toFlightId } }),
      // yeni uçuşta koltuğu doldur
      prisma.flight.update({
        where: { id: toFlightId },
        data: isBusiness
          ? { businessBooked: { increment: 1 } }
          : { economyBooked: { increment: 1 } },
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
          meta: { passengerId, toFlightId } as any,
        },
      }),
    ]);

    (req.app as any).get("io")?.emit("apply", {
      disruptionId,
      passengerId,
      toFlightId,
      actor: req.user?.name,
    });
    res.json({ ok: true, passengerId, toFlightId });
  }
);

// GET /api/disruptions/:id/proposals — kayıtlı öneriler (yolcu + uçuş bilgisiyle)
disruptionsRouter.get("/:id/proposals", async (req: Request, res: Response) => {
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

// GET /api/disruptions/:id/notifications — yolcu bildirim önizlemesi (SMS + e-posta)
disruptionsRouter.get("/:id/notifications", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const disruption = await prisma.disruption.findUnique({
    where: { id: req.params.id },
    include: { flight: { include: { depAirport: true, arrAirport: true } } },
  });
  if (!disruption) { res.status(404).json({ error: "Olay bulunamadı" }); return; }

  const origFlight = (disruption as any).flight;

  const [bookings, appliedProposals, careActions] = await Promise.all([
    prisma.booking.findMany({
      where: { flightId: origFlight.id, segmentOrder: 1 },
      include: { passenger: true },
    }),
    prisma.rebookingProposal.findMany({
      where: { disruptionId: req.params.id, status: "APPLIED" },
      include: { passenger: true, toFlight: { include: { depAirport: true, arrAirport: true } } },
    }),
    prisma.careAction.findMany({
      where: { disruptionId: req.params.id },
    }),
  ]);

  const careByPax = new Map(careActions.map((c: any) => [c.passengerId, c]));
  const proposalByPax = new Map(appliedProposals.map((p: any) => [p.passengerId, p]));

  const notifications = bookings.map((b: any) => {
    const pax = b.passenger;
    const applied = proposalByPax.get(pax.id);
    const care = careByPax.get(pax.id) as any;

    let careLineSms = "";
    let careLineEmail = "";
    if (care) {
      if (care.type === "HOTEL") {
        careLineSms = " Otel ve transfer ayarlandı.";
        careLineEmail = "\n🏨 Otel ve transfer hizmetiniz ayarlanmıştır.";
      } else if (care.type === "MEAL") {
        careLineSms = " İkram kuponunuz hazır.";
        careLineEmail = "\n🍽 İkram kuponunuz check-in kontuarından alınabilir.";
      } else if (care.type === "REFUND") {
        careLineSms = " Bilet ücretiniz iade edilecek.";
        careLineEmail = "\n💳 Bilet ücretiniz 7 iş günü içinde iade edilecektir.";
      }
    }

    let rebookLine = "";
    let rebookLineEmail = "";
    if (applied) {
      const nf = applied.toFlight as any;
      const depTime = new Date(nf.scheduledDep).toLocaleString("tr-TR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      });
      rebookLine = ` Yeni uçuşunuz: ${nf.flightNo} · ${depTime}.`;
      rebookLineEmail = `\n\n✈ Yeni uçuşunuz: ${nf.flightNo}\n   Kalkış: ${depTime} (${nf.depAirport.iata} → ${nf.arrAirport.iata})`;
    } else {
      rebookLine = " Yeni uçuş seçenekleri için gişelerimize başvurun.";
      rebookLineEmail = "\n\nYeni uçuş seçenekleri için havalimanı gişelerimize başvurabilirsiniz.";
    }

    const smsRaw = `Sayın ${pax.fullName}, ${origFlight.flightNo} uçuşunuzda aksama oluştu.${rebookLine}${careLineSms} Bilgi: 444 0 849`;
    const sms = smsRaw.length > 160 ? smsRaw.slice(0, 157) + "…" : smsRaw;

    const emailBody =
      `Sayın ${pax.fullName},\n\n` +
      `${origFlight.flightNo} (${origFlight.depAirport.iata}→${origFlight.arrAirport.iata}) uçuşunuzda aksama oluşmuştur.` +
      rebookLineEmail +
      careLineEmail +
      `\n\nHerhangi bir sorunuz için 7/24 hizmetinizdeyiz.\n444 0 849 · orbis@thy.com\n\nİyi yolculuklar,\nORBIS Yolcu Hizmetleri`;

    return {
      passengerId: pax.id,
      fullName: pax.fullName,
      email: pax.email ?? `yolcu-${pax.id.slice(0, 6)}@example.com`,
      ticketClass: pax.ticketClass,
      loyalty: pax.loyalty,
      hasRebooking: !!applied,
      careType: care?.type ?? null,
      status: applied ? "ready" : "pending",
      sms,
      emailSubject: `ORBIS Bildirim: ${origFlight.flightNo} uçuşunuzda değişiklik`,
      emailBody,
    };
  });

  res.json({
    disruptionId: req.params.id,
    flightNo: origFlight.flightNo,
    route: `${origFlight.depAirport.iata} → ${origFlight.arrAirport.iata}`,
    totalPassengers: bookings.length,
    readyCount: notifications.filter((n: any) => n.status === "ready").length,
    pendingCount: notifications.filter((n: any) => n.status === "pending").length,
    notifications,
  });
});

// GET /api/disruptions/:id/scenarios — senaryo karşılaştırması (2h gecikme / 4h gecikme / iptal)
disruptionsRouter.get("/:id/scenarios", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const disruption = await prisma.disruption.findUnique({
    where: { id: req.params.id },
    include: { flight: { include: { depAirport: true, arrAirport: true } } },
  });
  if (!disruption) { res.status(404).json({ error: "Olay bulunamadı" }); return; }

  const flight = (disruption as any).flight;

  const [depAp, arrAp, bookings] = await Promise.all([
    prisma.airport.findUnique({ where: { id: flight.depAirportId }, select: { lat: true, lon: true } }),
    prisma.airport.findUnique({ where: { id: flight.arrAirportId }, select: { lat: true, lon: true } }),
    prisma.booking.findMany({
      where: { flightId: flight.id, segmentOrder: 1 },
      include: { passenger: true },
    }),
  ]);

  const distKm = depAp && arrAp
    ? Math.round(haversineKm((depAp as any).lat, (depAp as any).lon, (arrAp as any).lat, (arrAp as any).lon))
    : 0;

  const paxCount = bookings.length;
  const businessCount = bookings.filter((b: any) => (b.passenger as any).ticketClass === "BUSINESS").length;
  const economyCount = paxCount - businessCount;
  const isWeather = (disruption as any).type === "WEATHER";
  const compPerPax = eu261PerPax(distKm);

  const avgEconomy = estimatedTicketPrice(distKm, "ECONOMY");
  const avgBusiness = estimatedTicketPrice(distKm, "BUSINESS");
  const totalRevenue = economyCount * avgEconomy + businessCount * avgBusiness;

  // Senaryo A: 2 saat gecikme — ikram, EU261 yok (<3h)
  const s2h = {
    id: "delay_2h",
    label: "2 Saat Gecikme",
    icon: "clock",
    delayMin: 120,
    paxImpact: paxCount,
    care: { meal: Math.round(paxCount * 15), hotel: 0, transfer: 0 },
    eu261: 0, // <3 saat → tazminat yok
    rebookingLoad: Math.round(paxCount * 0.08), // bağlantı kaçıranlar
    revenueLoss: Math.round(totalRevenue * 0.02),
    operationalScore: 88,
    recommendation: "Tercih edilen senaryo — minimum maliyet, yolcu memnuniyeti korunur.",
  };

  // Senaryo B: 4 saat gecikme — ikram × 2, EU261 tam
  const s4h = {
    id: "delay_4h",
    label: "4 Saat Gecikme",
    icon: "clock",
    delayMin: 240,
    paxImpact: paxCount,
    care: { meal: Math.round(paxCount * 15 * 2), hotel: 0, transfer: 0 },
    eu261: !isWeather ? Math.round(compPerPax * paxCount) : 0,
    rebookingLoad: Math.round(paxCount * 0.2),
    revenueLoss: Math.round(totalRevenue * 0.06),
    operationalScore: 62,
    recommendation: "EU261 tazminat yükümlülüğü doğar — müşteri hizmetleri hazır tutulmalı.",
  };

  // Senaryo C: İptal — otel + EU261 + tam yeniden atama
  const sCancel = {
    id: "cancel",
    label: "Uçuş İptali",
    icon: "x-circle",
    delayMin: 0,
    paxImpact: paxCount,
    care: {
      meal: Math.round(paxCount * 0.45 * 15),
      hotel: Math.round(paxCount * 0.55 * 80),
      transfer: Math.round(paxCount * 0.55 * 25),
    },
    eu261: !isWeather ? Math.round(compPerPax * paxCount) : 0,
    rebookingLoad: paxCount,
    revenueLoss: Math.round(totalRevenue * 0.28),
    operationalScore: 28,
    recommendation: "Son çare — tüm yolcular yeniden atanmalı, tazminat + otel yükümlülüğü yüksek.",
  };

  const addTotal = (s: any) => ({
    ...s,
    totalCost: s.care.meal + s.care.hotel + s.care.transfer + s.eu261 + s.revenueLoss,
  });

  res.json({
    disruptionId: req.params.id,
    flightNo: flight.flightNo,
    route: `${flight.depAirport.iata} → ${flight.arrAirport.iata}`,
    distanceKm: distKm,
    paxCount,
    businessCount,
    economyCount,
    isWeatherExempt: isWeather,
    eu261PerPax: compPerPax,
    currency: "EUR",
    scenarios: [s2h, s4h, sCancel].map(addTotal),
  });
});

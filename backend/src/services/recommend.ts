// ORBIS — IRROPS yeniden yerleştirme (re-accommodation) öneri motoru
// Kural bazlı öncelik skoru + AI optimal atama (min-cost flow), AI kapalıysa
// kapasite-duyarlı açgözlü atamaya düşer. Her öneride şeffaf gerekçe döner.

import { prisma } from "../db.js";
import { getOptimalAssignment, predictDelays } from "./aiClient.js";

const LOYALTY_W: Record<string, number> = { ELITE_PLUS: 1, ELITE: 0.7, CLASSIC: 0.4, NONE: 0.1 };
const CLASS_W: Record<string, number> = { BUSINESS: 1, ECONOMY: 0.4 };
const SPECIAL_W: Record<string, number> = { UM: 1, MEDICAL: 1, VIP: 0.9, WCHR: 0.8, NONE: 0.1 };

const TR_LOYALTY: Record<string, string> = {
  ELITE_PLUS: "Elite Plus",
  ELITE: "Elite",
  CLASSIC: "Classic",
  NONE: "üye değil",
};
const TR_CLASS: Record<string, string> = { BUSINESS: "Business", ECONOMY: "Economy" };

interface CostParams {
  w_loyalty: number;
  w_class: number;
  w_connection: number;
  w_special: number;
  hotel_unit: number;
  meal_unit: number;
  transfer_unit: number;
}

async function loadWeights(): Promise<CostParams> {
  const params = await prisma.costParam.findMany();
  const map = Object.fromEntries(params.map((p: any) => [p.key, p.value]));
  return {
    w_loyalty: map.w_loyalty ?? 30,
    w_class: map.w_class ?? 20,
    w_connection: map.w_connection ?? 30,
    w_special: map.w_special ?? 20,
    hotel_unit: map.hotel_unit ?? 80,
    meal_unit: map.meal_unit ?? 15,
    transfer_unit: map.transfer_unit ?? 25,
  };
}

interface Passenger {
  loyalty: string;
  ticketClass: string;
  hasConnection: boolean;
  specialNeed?: string;
}

function priorityScore(p: Passenger, w: CostParams): number {
  const loyalty = LOYALTY_W[p.loyalty] ?? 0.1;
  const cls = CLASS_W[p.ticketClass] ?? 0.4;
  const conn = p.hasConnection ? 1 : 0.3;
  const special = SPECIAL_W[p.specialNeed || "NONE"] ?? 0.1;
  const total = w.w_loyalty + w.w_class + w.w_connection + w.w_special;
  const raw =
    loyalty * w.w_loyalty + cls * w.w_class + conn * w.w_connection + special * w.w_special;
  return Math.round((raw / total) * 100);
}

interface CareResult {
  type: string;
  amount: number;
  note: string;
}

function careFor(addedDelayMin: number, hasOption: boolean, w: CostParams): CareResult | null {
  if (!hasOption)
    return {
      type: "REFUND",
      amount: 0,
      note: "Uygun alternatif yok — ücret iadesi/tazminat",
    };
  if (addedDelayMin >= 360)
    return {
      type: "HOTEL",
      amount: w.hotel_unit + w.transfer_unit,
      note: "6+ saat bekleme — otel + transfer",
    };
  if (addedDelayMin >= 120)
    return {
      type: "MEAL",
      amount: w.meal_unit,
      note: "2-6 saat bekleme — ikram",
    };
  return null;
}

export interface RecommendationResult {
  disruptionId: string;
  flightNo: string;
  affectedCount: number;
  alternativeCount: number;
  method: string;
  passengers: Array<{
    passengerId: string;
    pnr: string;
    fullName: string;
    ticketClass: string;
    loyalty: string;
    specialNeed?: string;
    hasConnection: boolean;
    score: number;
    options: Array<{
      toFlightId: string;
      toFlightNo: string;
      rank: number;
      addedDelayMin: number;
      fitScore: number;
      rationale: string;
    }>;
    care?: CareResult;
  }>;
}

export async function recommendForDisruption(disruptionId: string): Promise<RecommendationResult> {
  const disruption = await prisma.disruption.findUnique({
    where: { id: disruptionId },
    include: { flight: { include: { arrAirport: true } } },
  });
  if (!disruption) throw new Error("Olay bulunamadı");

  const orig = (disruption as any).flight;
  const destId = orig.arrAirportId;
  const w = await loadWeights();

  const bookings = await prisma.booking.findMany({
    where: { flightId: orig.id, segmentOrder: 1 },
    include: { passenger: true },
  });

  const alts = await prisma.flight.findMany({
    where: {
      arrAirportId: destId,
      id: { not: orig.id },
      status: { in: ["PLANNED", "DELAYED", "BOARDING"] },
      scheduledDep: { gte: orig.scheduledDep },
    },
    orderBy: { scheduledDep: "asc" },
  });

  // Orijinal (sınıf bazlı) boş koltuk
  interface CapacityInfo {
    ECONOMY: number;
    BUSINESS: number;
    addedDelayMin: number;
    flightNo: string;
    predictedDelayMin: number;
  }
  const avail: Record<string, CapacityInfo> = {};
  for (const a of alts) {
    avail[a.id] = {
      ECONOMY: Math.max(0, (a as any).economyCap - (a as any).economyBooked),
      BUSINESS: Math.max(0, (a as any).businessCap - (a as any).businessBooked),
      addedDelayMin: Math.round(((a as any).scheduledDep - orig.scheduledDep) / 60000),
      flightNo: (a as any).flightNo,
      predictedDelayMin: 0, // ML ile doldurulacak
    };
  }

  // ML: her alternatif uçuşun kendi gecikme riskini tahmin et (kararı etkiler)
  const isWeather = (disruption as any).type === "WEATHER";
  const mlItems = alts.map((a: any) => ({
    departureHour: new Date(a.scheduledDep).getHours(),
    loadFactor: Math.min(
      1,
      (a.economyBooked + a.businessBooked) / Math.max(1, a.economyCap + a.businessCap)
    ),
    routeHaulHours: Math.max(1, (a.scheduledArr - a.scheduledDep) / 3600000),
    weatherSeverity: isWeather ? 0.6 : 0.3,
  }));

  const preds = await predictDelays(mlItems);
  if (preds) {
    alts.forEach((a: any, i: number) => {
      avail[a.id].predictedDelayMin = preds[i]?.expectedDelayMin ?? 0;
    });
  }

  // Öncelik skoru
  const scored = await Promise.all(
    bookings.map(async (b: any) => {
      const connection = await prisma.booking.findFirst({
        where: { pnr: b.pnr, isConnection: true },
      });
      const pax = {
        passengerId: b.passengerId,
        pnr: b.pnr,
        fullName: (b.passenger as any).fullName,
        ticketClass: (b.passenger as any).ticketClass,
        loyalty: (b.passenger as any).loyalty,
        specialNeed: (b.passenger as any).specialNeed,
        hasConnection: !!connection,
        score: 0,
      };
      pax.score = priorityScore(pax as any, w);
      return pax;
    })
  );
  scored.sort((a, b) => b.score - a.score);

  // AI optimal atama (min-cost flow); kapalıysa null
  const optimal = await getOptimalAssignment({
    passengers: scored.map((p) => ({
      passengerId: p.passengerId,
      ticketClass: p.ticketClass,
      priority: p.score,
    })),
    alternatives: alts.map((a: any) => ({
      flightId: a.id,
      economyAvail: avail[a.id].ECONOMY,
      businessAvail: avail[a.id].BUSINESS,
      // risk-ayarlı: tarife gecikmesi + ML'in öngördüğü ikincil gecikme yarısı
      addedDelayMin:
        avail[a.id].addedDelayMin + Math.round((avail[a.id].predictedDelayMin || 0) * 0.5),
    })),
  });

  const optimalMap = optimal
    ? Object.fromEntries(
        optimal.assignments.filter((a: any) => a.toFlightId).map((a: any) => [a.passengerId, a.toFlightId])
      )
    : null;
  const method = optimalMap ? "optimal (min-cost flow)" : "greedy (heuristik)";

  // Greedy fallback için değişebilir kapasite
  const greedyCap = JSON.parse(JSON.stringify(avail));

  const proposals: any[] = [];
  const result: any[] = [];

  for (const pax of scored) {
    const classKey = pax.ticketClass;
    const eligible = alts
      .filter((a: any) => (avail[a.id] as any)[classKey] > 0)
      .sort((a: any, b: any) => avail[a.id].addedDelayMin - avail[b.id].addedDelayMin);

    // Seçilen uçuş: AI varsa optimal, yoksa açgözlü
    let chosenId: string | null = null;
    if (optimalMap) {
      chosenId = optimalMap[pax.passengerId] || null;
    } else {
      const g = eligible.find((a: any) => (greedyCap[a.id] as any)[classKey] > 0);
      if (g) {
        chosenId = g.id;
        (greedyCap[g.id] as any)[classKey] -= 1;
      }
    }

    // Gösterim seçenekleri: seçilen önce, sonra gecikmeye göre (top 3)
    let ordered: any[] = eligible;
    if (chosenId) {
      const chosen = alts.find((a: any) => a.id === chosenId);
      if (chosen) {
        ordered = [chosen, ...eligible.filter((a: any) => a.id !== chosenId)];
      }
    }
    ordered = ordered.slice(0, 3);

    const options = ordered.map((a: any, idx: number) => {
      const v = avail[a.id];
      const fit = Math.max(0, 100 - v.addedDelayMin * 0.08);
      const connNote = pax.hasConnection
        ? v.addedDelayMin <= 180
          ? " · bağlantı korunabilir"
          : " · bağlantı riskli"
        : "";
      const riskNote =
        v.predictedDelayMin >= 45 ? ` · ⚠ tahmini gecikme riski ~${v.predictedDelayMin} dk` : "";
      return {
        toFlightId: a.id,
        toFlightNo: v.flightNo,
        rank: idx + 1,
        addedDelayMin: v.addedDelayMin,
        fitScore: Math.round(fit),
        rationale: `${v.flightNo} ile +${v.addedDelayMin} dk · ${TR_LOYALTY[pax.loyalty]}, ${
          TR_CLASS[pax.ticketClass]
        }${connNote}${riskNote}`,
      };
    });

    const best = options[0];
    const care = careFor(best?.addedDelayMin ?? Infinity, !!best, w);
    result.push({ ...pax, options, care });

    for (const o of options) {
      proposals.push({
        disruptionId,
        passengerId: pax.passengerId,
        fromFlightId: orig.id,
        toFlightId: o.toFlightId,
        score: pax.score,
        rank: o.rank,
        addedDelayMin: o.addedDelayMin,
        rationale: o.rationale,
      });
    }
  }

  await prisma.rebookingProposal.deleteMany({ where: { disruptionId } });
  if (proposals.length) await prisma.rebookingProposal.createMany({ data: proposals });

  await prisma.careAction.deleteMany({ where: { disruptionId } });
  const careRows = result
    .filter((r: any) => r.care)
    .map((r: any) => ({
      disruptionId,
      passengerId: r.passengerId,
      type: r.care.type,
      amount: r.care.amount,
      note: r.care.note,
    }));
  if (careRows.length) await prisma.careAction.createMany({ data: careRows });

  return {
    disruptionId,
    flightNo: orig.flightNo,
    affectedCount: scored.length,
    alternativeCount: alts.length,
    method,
    passengers: result,
  };
}

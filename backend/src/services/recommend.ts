// ORBIS — IRROPS yeniden yerleştirme (re-accommodation) öneri motoru
// Kural bazlı öncelik skoru + AI optimal atama (min-cost flow), AI kapalıysa
// kapasite-duyarlı açgözlü atamaya düşer. Her öneride şeffaf gerekçe döner.

import { prisma } from "../db.js";
import { getOptimalAssignment, predictDelays } from "./aiClient.js";

// Haversine mesafesi (km) — EU261 tazminat dilimi için
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// EU261/2004 tazminat (EUR/yolcu) — hava olaylarında muafiyet uygulanır
export function eu261PerPax(distanceKm: number): number {
  if (distanceKm < 1500) return 250;
  if (distanceKm < 3500) return 400;
  return 600;
}

// Ortalama bilet fiyatı tahmini (USD)
export function estimatedTicketPrice(distanceKm: number, ticketClass: string): number {
  let base: number;
  if (distanceKm < 1500) base = 150;
  else if (distanceKm < 4000) base = 350;
  else base = 620;
  return ticketClass === "BUSINESS" ? Math.round(base * 3.5) : base;
}

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

export interface RevenueImpact {
  distanceKm: number;
  eligibleForEu261: boolean;
  compPerPax: number;
  totalEu261: number;
  totalCare: number;
  estimatedRevenueLoss: number;
  grandTotal: number;
  currency: string;
  breakdown: {
    hotel: number;
    meal: number;
    compensation: number;
    revenueLoss: number;
  };
}

export interface RecommendationResult {
  disruptionId: string;
  flightNo: string;
  affectedCount: number;
  alternativeCount: number;
  method: string;
  revenueImpact: RevenueImpact;
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
    include: { arrAirport: true, depAirport: true },
    orderBy: { scheduledDep: "asc" },
  });

  // Varış havalimanının MCT (transfer için kritik)
  const arrMCT = (orig.arrAirport as any).mctMin ?? 60;

  // Hub gate yoğunluğu: kalkış havalimanındaki toplam gate sayısı
  // ve aynı 2 saatte kaç uçuş var → gate müsaitliğini tahmin et
  const depAirport = await prisma.airport.findUnique({ where: { id: orig.depAirportId } });
  const hubGateCount = (depAirport as any)?.gateCount ?? 20;
  const windowStart = orig.scheduledDep;
  const windowEnd = new Date(orig.scheduledDep.getTime() + 2 * 3600_000);
  const concurrentFlights = await prisma.flight.count({
    where: {
      depAirportId: orig.depAirportId,
      status: { in: ["PLANNED", "BOARDING", "DELAYED"] },
      scheduledDep: { gte: windowStart, lte: windowEnd },
    },
  });
  // Gate kullanım oranı: 1.0 = tüm gate'ler dolu
  const gateUtilization = Math.min(1, concurrentFlights / Math.max(hubGateCount, 1));

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

  // Öncelik skoru + bağlantı uçuş bilgisi (ACT/MCT için)
  const scored = await Promise.all(
    bookings.map(async (b: any) => {
      const connection = await prisma.booking.findFirst({
        where: { pnr: b.pnr, isConnection: true },
        include: { flight: true },
      });
      const pax = {
        passengerId: b.passengerId,
        pnr: b.pnr,
        fullName: (b.passenger as any).fullName,
        ticketClass: (b.passenger as any).ticketClass,
        loyalty: (b.passenger as any).loyalty,
        specialNeed: (b.passenger as any).specialNeed,
        hasConnection: !!connection,
        connectionDep: connection ? (connection as any).flight?.scheduledDep : null,
        connectionFlightNo: connection ? (connection as any).flight?.flightNo : null,
        score: 0,
      };
      pax.score = priorityScore(pax as any, w);
      return pax;
    })
  );
  scored.sort((a, b) => b.score - a.score);

  // #1 PNR BÜTÜNLÜĞÜ: aynı PNR'deki yolcuları grupla
  // Grup skoru = grubun en yüksek bireysel skoru (aile/grup yüksek öncelikliyle gelsin)
  const pnrGroups = new Map<string, typeof scored>();
  for (const p of scored) {
    if (!pnrGroups.has(p.pnr)) pnrGroups.set(p.pnr, []);
    pnrGroups.get(p.pnr)!.push(p);
  }
  const groups = Array.from(pnrGroups.entries()).map(([pnr, members]) => ({
    pnr,
    members,
    score: Math.max(...members.map((m) => m.score)),
    size: members.length,
    // Grubun sınıf dağılımı (atama için)
    economyCount: members.filter((m) => m.ticketClass === "ECONOMY").length,
    businessCount: members.filter((m) => m.ticketClass === "BUSINESS").length,
    // Bağlantı bilgisi: gruptan herhangi birinin bağlantısı varsa al
    connectionDep: members.find((m) => m.connectionDep)?.connectionDep || null,
    connectionFlightNo: members.find((m) => m.connectionFlightNo)?.connectionFlightNo || null,
  }));
  groups.sort((a, b) => b.score - a.score);

  // #2 ACT/MCT: Bir alternatif uçuş seçildiğinde bağlantı korunur mu?
  // Yeni varış zamanı + MCT(hub) ≤ bağlantı kalkışı ise bağlantı kurtulur.
  function connectionSafe(alt: any, connectionDep: Date | null): boolean {
    if (!connectionDep) return true;
    const newArrivalMs = new Date(alt.scheduledArr).getTime();
    const connectionDepMs = new Date(connectionDep).getTime();
    return newArrivalMs + arrMCT * 60 * 1000 <= connectionDepMs;
  }
  function connectionMissedPenalty(alt: any, connectionDep: Date | null): number {
    // Bağlantı kaçırılırsa OR-Tools maliyetine ek dakika ekle (ceza)
    if (!connectionDep) return 0;
    return connectionSafe(alt, connectionDep) ? 0 : 240; // 4 saat ek ceza
  }

  // AI optimal atama (min-cost flow); kapalıysa null
  // #1 PNR: Her grup tek birim olarak gönderilir, gerekli kapasite = grup büyüklüğü
  // Bağlantısı olanlar için connectionMissedPenalty ek maliyet (her alternatif farklı olabilir,
  // OR-Tools tek "addedDelayMin" beklediği için ortalama bir grup-bağlantı cezası ekleyelim)
  const optimal = await getOptimalAssignment({
    passengers: groups.map((g) => ({
      passengerId: g.pnr, // PNR'yi yolcu kimliği olarak ver (grup birim)
      ticketClass: g.businessCount > 0 ? "BUSINESS" : "ECONOMY", // grup ağırlıklı
      priority: g.score,
    })),
    alternatives: alts.map((a: any) => {
      // Grupların ortalama bağlantı kaçırma ihtimali maliyete eklenir
      const avgConnectionPenalty =
        groups.reduce((s, g) => s + connectionMissedPenalty(a, g.connectionDep), 0) /
        Math.max(groups.length, 1);
      return {
        flightId: a.id,
        economyAvail: avail[a.id].ECONOMY,
        businessAvail: avail[a.id].BUSINESS,
        // risk-ayarlı: tarife gecikmesi + ML gecikme + bağlantı cezası + gate yoğunluğu cezası
        // Gate doluluk oranı yüksekse her alternatife ek dakika eklenir
        addedDelayMin:
          avail[a.id].addedDelayMin +
          Math.round((avail[a.id].predictedDelayMin || 0) * 0.5) +
          Math.round(avgConnectionPenalty) +
          Math.round(gateUtilization * 20), // max 20 dk gate bekleme cezası
      };
    }),
  });

  const optimalMap = optimal
    ? Object.fromEntries(
        optimal.assignments
          .filter((a: any) => a.toFlightId)
          .map((a: any) => [a.passengerId, a.toFlightId])
      )
    : null;
  const method = optimalMap ? "optimal (PNR-grup + min-cost flow)" : "greedy (PNR-grup)";

  // Greedy fallback için değişebilir kapasite
  const greedyCap = JSON.parse(JSON.stringify(avail));

  const proposals: any[] = [];
  const result: any[] = [];

  // #1 PNR-grup bazlı atama döngüsü
  for (const group of groups) {
    // Grup için uygun alternatif: hem ekonomy hem business kontenjanı yeterli olmalı
    const eligible = alts
      .filter(
        (a: any) =>
          avail[a.id].ECONOMY >= group.economyCount &&
          avail[a.id].BUSINESS >= group.businessCount
      )
      .sort((a: any, b: any) => {
        // Önce bağlantı koruyanlar, sonra gecikme
        const sA = connectionSafe(a, group.connectionDep) ? 0 : 1000;
        const sB = connectionSafe(b, group.connectionDep) ? 0 : 1000;
        return sA + avail[a.id].addedDelayMin - (sB + avail[b.id].addedDelayMin);
      });

    let chosenId: string | null = null;
    if (optimalMap) {
      chosenId = optimalMap[group.pnr] || null;
    } else {
      const g = eligible.find(
        (a: any) =>
          (greedyCap[a.id] as any).ECONOMY >= group.economyCount &&
          (greedyCap[a.id] as any).BUSINESS >= group.businessCount
      );
      if (g) {
        chosenId = g.id;
        (greedyCap[g.id] as any).ECONOMY -= group.economyCount;
        (greedyCap[g.id] as any).BUSINESS -= group.businessCount;
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

    // Her grup üyesi için aynı seçenekleri üret (PNR bütünlüğü)
    for (const pax of group.members) {
      const options = ordered.map((a: any, idx: number) => {
        const v = avail[a.id];
        const fit = Math.max(0, 100 - v.addedDelayMin * 0.08);
        // #2 Bağlantı gerçek hesabı (ACT/MCT)
        const safe = connectionSafe(a, group.connectionDep);
        let connNote = "";
        if (pax.hasConnection) {
          if (safe) {
            connNote = ` · bağlantı korunur (${group.connectionFlightNo})`;
          } else {
            connNote = ` · ⚠ ${group.connectionFlightNo} bağlantısı kaçırılır`;
          }
        }
        // Grup bütünlüğü notu
        const groupNote = group.size > 1 ? ` · PNR grubu (${group.size} kişi)` : "";
        const riskNote =
          v.predictedDelayMin >= 45
            ? ` · tahmini gecikme riski ~${v.predictedDelayMin} dk`
            : "";
        // Gate notu: alternatif uçuşun gate'i varsa göster
        const gateNote = (a as any).gate ? ` · Gate ${(a as any).gate}` : "";
        // Hub yoğunluğu uyarısı
        const congestionNote =
          gateUtilization >= 0.8
            ? ` · ⚠ hub yoğun (%${Math.round(gateUtilization * 100)} gate dolu)`
            : "";
        return {
          toFlightId: a.id,
          toFlightNo: v.flightNo,
          rank: idx + 1,
          addedDelayMin: v.addedDelayMin,
          fitScore: Math.round(fit),
          rationale: `${v.flightNo} ile +${v.addedDelayMin} dk · ${TR_LOYALTY[pax.loyalty]}, ${TR_CLASS[pax.ticketClass]}${groupNote}${gateNote}${connNote}${riskNote}${congestionNote}`,
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

  // --- Gelir Etkisi (Revenue Impact) ---
  const depAirportCoords = await prisma.airport.findUnique({
    where: { id: orig.depAirportId },
    select: { lat: true, lon: true },
  });
  const arrAirportFull = await prisma.airport.findUnique({
    where: { id: orig.arrAirportId },
    select: { lat: true, lon: true },
  });
  const distKm = depAirportCoords && arrAirportFull
    ? Math.round(haversineKm(
        (depAirportCoords as any).lat, (depAirportCoords as any).lon,
        (arrAirportFull as any).lat, (arrAirportFull as any).lon
      ))
    : 0;

  // EU261/2004: hava durumu muafiyet, diğer nedenler tam tazminat
  const eligibleForEu261 = (disruption as any).type !== "WEATHER";
  const compPerPax = eu261PerPax(distKm);
  const totalEu261 = eligibleForEu261 ? compPerPax * scored.length : 0;

  const hotelTotal = careRows.filter((c) => c.type === "HOTEL").reduce((s, c) => s + c.amount, 0);
  const mealTotal = careRows.filter((c) => c.type === "MEAL").reduce((s, c) => s + c.amount, 0);
  const totalCare = Math.round(hotelTotal + mealTotal);

  const avgTicket =
    result.reduce((s: number, r: any) => s + estimatedTicketPrice(distKm, r.ticketClass), 0) /
    Math.max(result.length, 1);
  const estimatedRevenueLoss = Math.round(avgTicket * scored.length * 0.15); // 15% = iptal cezası / gelir erimesi

  const revenueImpact: RevenueImpact = {
    distanceKm: distKm,
    eligibleForEu261,
    compPerPax: eligibleForEu261 ? compPerPax : 0,
    totalEu261: Math.round(totalEu261),
    totalCare,
    estimatedRevenueLoss,
    grandTotal: Math.round(totalEu261 + totalCare + estimatedRevenueLoss),
    currency: "EUR",
    breakdown: {
      hotel: Math.round(hotelTotal),
      meal: Math.round(mealTotal),
      compensation: Math.round(totalEu261),
      revenueLoss: estimatedRevenueLoss,
    },
  };

  return {
    disruptionId,
    flightNo: orig.flightNo,
    affectedCount: scored.length,
    alternativeCount: alts.length,
    method,
    revenueImpact,
    passengers: result,
  };
}

// ORBIS — IRROPS yeniden yerleştirme (re-accommodation) öneri motoru
// Kural bazlı öncelik skoru + AI optimal atama (min-cost flow), AI kapalıysa
// kapasite-duyarlı açgözlü atamaya düşer. Her öneride şeffaf gerekçe döner.
import { prisma } from "../db.js";
import { getOptimalAssignment, predictDelays } from "./aiClient.js";

const LOYALTY_W = { ELITE_PLUS: 1, ELITE: 0.7, CLASSIC: 0.4, NONE: 0.1 };
const CLASS_W = { BUSINESS: 1, ECONOMY: 0.4 };
const SPECIAL_W = { UM: 1, MEDICAL: 1, VIP: 0.9, WCHR: 0.8, NONE: 0.1 };

const TR_LOYALTY = { ELITE_PLUS: "Elite Plus", ELITE: "Elite", CLASSIC: "Classic", NONE: "üye değil" };
const TR_CLASS = { BUSINESS: "Business", ECONOMY: "Economy" };

async function loadWeights() {
  const params = await prisma.costParam.findMany();
  const map = Object.fromEntries(params.map((p) => [p.key, p.value]));
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

function priorityScore(p, w) {
  const loyalty = LOYALTY_W[p.loyalty] ?? 0.1;
  const cls = CLASS_W[p.ticketClass] ?? 0.4;
  const conn = p.hasConnection ? 1 : 0.3;
  const special = SPECIAL_W[p.specialNeed] ?? 0.1;
  const total = w.w_loyalty + w.w_class + w.w_connection + w.w_special;
  const raw =
    loyalty * w.w_loyalty + cls * w.w_class + conn * w.w_connection + special * w.w_special;
  return Math.round((raw / total) * 100);
}

function careFor(addedDelayMin, hasOption, w) {
  if (!hasOption) return { type: "REFUND", amount: 0, note: "Uygun alternatif yok — ücret iadesi/tazminat" };
  if (addedDelayMin >= 360) return { type: "HOTEL", amount: w.hotel_unit + w.transfer_unit, note: "6+ saat bekleme — otel + transfer" };
  if (addedDelayMin >= 120) return { type: "MEAL", amount: w.meal_unit, note: "2-6 saat bekleme — ikram" };
  return null;
}

export async function recommendForDisruption(disruptionId) {
  const disruption = await prisma.disruption.findUnique({
    where: { id: disruptionId },
    include: { flight: { include: { arrAirport: true } } },
  });
  if (!disruption) throw new Error("Olay bulunamadı");

  const orig = disruption.flight;
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
  const avail = {};
  for (const a of alts) {
    avail[a.id] = {
      ECONOMY: Math.max(0, a.economyCap - a.economyBooked),
      BUSINESS: Math.max(0, a.businessCap - a.businessBooked),
      addedDelayMin: Math.round((a.scheduledDep - orig.scheduledDep) / 60000),
      flightNo: a.flightNo,
      predictedDelayMin: 0, // ML ile doldurulacak
    };
  }

  // ML: her alternatif uçuşun kendi gecikme riskini tahmin et (kararı etkiler)
  const isWeather = disruption.type === "WEATHER";
  const mlItems = alts.map((a) => ({
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
    alts.forEach((a, i) => {
      avail[a.id].predictedDelayMin = preds[i]?.expectedDelayMin ?? 0;
    });
  }

  // Öncelik skoru
  const scored = await Promise.all(
    bookings.map(async (b) => {
      const connection = await prisma.booking.findFirst({
        where: { pnr: b.pnr, isConnection: true },
      });
      const pax = {
        passengerId: b.passengerId,
        pnr: b.pnr,
        fullName: b.passenger.fullName,
        ticketClass: b.passenger.ticketClass,
        loyalty: b.passenger.loyalty,
        specialNeed: b.passenger.specialNeed,
        hasConnection: !!connection,
      };
      pax.score = priorityScore(pax, w);
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
    alternatives: alts.map((a) => ({
      flightId: a.id,
      economyAvail: avail[a.id].ECONOMY,
      businessAvail: avail[a.id].BUSINESS,
      // risk-ayarlı: tarife gecikmesi + ML'in öngördüğü ikincil gecikme yarısı
      addedDelayMin:
        avail[a.id].addedDelayMin + Math.round((avail[a.id].predictedDelayMin || 0) * 0.5),
    })),
  });
  const optimalMap = optimal
    ? Object.fromEntries(optimal.assignments.filter((a) => a.toFlightId).map((a) => [a.passengerId, a.toFlightId]))
    : null;
  const method = optimalMap ? "optimal (min-cost flow)" : "greedy (heuristik)";

  // Greedy fallback için değişebilir kapasite
  const greedyCap = JSON.parse(JSON.stringify(avail));

  const proposals = [];
  const result = [];

  for (const pax of scored) {
    const classKey = pax.ticketClass;
    const eligible = alts
      .filter((a) => avail[a.id][classKey] > 0)
      .sort((a, b) => avail[a.id].addedDelayMin - avail[b.id].addedDelayMin);

    // Seçilen uçuş: AI varsa optimal, yoksa açgözlü
    let chosenId = null;
    if (optimalMap) {
      chosenId = optimalMap[pax.passengerId] || null;
    } else {
      const g = eligible.find((a) => greedyCap[a.id][classKey] > 0);
      if (g) {
        chosenId = g.id;
        greedyCap[g.id][classKey] -= 1;
      }
    }

    // Gösterim seçenekleri: seçilen önce, sonra gecikmeye göre (top 3)
    let ordered = eligible;
    if (chosenId) {
      ordered = [alts.find((a) => a.id === chosenId), ...eligible.filter((a) => a.id !== chosenId)].filter(Boolean);
    }
    ordered = ordered.slice(0, 3);

    const options = ordered.map((a, idx) => {
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
        rationale: `${v.flightNo} ile +${v.addedDelayMin} dk · ${TR_LOYALTY[pax.loyalty]}, ${TR_CLASS[pax.ticketClass]}${connNote}${riskNote}`,
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
    .filter((r) => r.care)
    .map((r) => ({
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

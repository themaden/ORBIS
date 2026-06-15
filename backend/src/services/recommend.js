// ORBIS — IRROPS yeniden yerleştirme (re-accommodation) öneri motoru
// Kural bazlı öncelik skoru + kapasite-duyarlı açgözlü atama + care önerileri.
// (Şeffaf/açıklanabilir: her öneride gerekçe döner.)
import { prisma } from "../db.js";

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

  // Etkilenen yolcular (iptal uçuşun 1. segmenti)
  const bookings = await prisma.booking.findMany({
    where: { flightId: orig.id, segmentOrder: 1 },
    include: { passenger: true },
  });

  // Aday alternatif uçuşlar: aynı varış, iptal değil, sonra kalkan
  const alts = await prisma.flight.findMany({
    where: {
      arrAirportId: destId,
      id: { not: orig.id },
      status: { in: ["PLANNED", "DELAYED", "BOARDING"] },
      scheduledDep: { gte: orig.scheduledDep },
    },
    orderBy: { scheduledDep: "asc" },
  });

  // Kalan kapasite haritası (sınıf bazlı)
  const cap = {};
  for (const a of alts) {
    cap[a.id] = {
      ECONOMY: Math.max(0, a.economyCap - a.economyBooked),
      BUSINESS: Math.max(0, a.businessCap - a.businessBooked),
      addedDelayMin: Math.round((a.scheduledDep - orig.scheduledDep) / 60000),
      flightNo: a.flightNo,
      scheduledDep: a.scheduledDep,
    };
  }

  // Yolcuları öncelik skoruna göre sırala
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

  // Açgözlü atama: yüksek öncelikli yolcudan başla
  const proposals = []; // DB'ye yazılacak satırlar
  const result = [];

  for (const pax of scored) {
    // Sınıfına uygun, kapasitesi olan alternatifleri gecikmeye göre sırala
    const usable = alts
      .filter((a) => cap[a.id][pax.ticketClass] > 0)
      .sort((a, b) => cap[a.id].addedDelayMin - cap[b.id].addedDelayMin)
      .slice(0, 3);

    const options = usable.map((a, idx) => {
      const c = cap[a.id];
      const fit = Math.max(0, 100 - c.addedDelayMin * 0.08);
      const connNote = pax.hasConnection
        ? c.addedDelayMin <= 180
          ? " · bağlantı korunabilir"
          : " · bağlantı riskli"
        : "";
      return {
        toFlightId: a.id,
        toFlightNo: c.flightNo,
        rank: idx + 1,
        addedDelayMin: c.addedDelayMin,
        fitScore: Math.round(fit),
        rationale: `${c.flightNo} ile +${c.addedDelayMin} dk · ${TR_LOYALTY[pax.loyalty]}, ${TR_CLASS[pax.ticketClass]}${connNote}`,
      };
    });

    // En iyi seçeneği gerçekten ata (kapasiteyi düş)
    if (options.length) {
      cap[options[0].toFlightId][pax.ticketClass] -= 1;
    }

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

  // Kalıcılaştır: önce eski önerileri temizle
  await prisma.rebookingProposal.deleteMany({ where: { disruptionId } });
  if (proposals.length) await prisma.rebookingProposal.createMany({ data: proposals });

  // Care önerilerini kaydet
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
    passengers: result,
  };
}

import { prisma } from "../db.js";
import { getRiskScore, RiskScoreResult } from "./aiClient.js";

export interface KPIData {
  riskIndex: number;
  riskLevel: string;
  riskFactors: string[];
  riskSuggestions: string[];
  riskSource: string;
  totalFlights: number;
  cancelled: number;
  delayed: number;
  openDisruptions: number;
  affectedPassengers: number;
  avgLoadFactor: number;
  ts: number;
}

// Anlık dalgalanma yaratan dinamik etkenler (gerçek üretimde dış API'lerden gelir)
function diurnalLoad(): number {
  // Saate göre operasyonel yoğunluk: 06-09 ve 16-21 zirve, 02-05 dip
  const h = new Date().getHours();
  if (h >= 6 && h <= 9) return 0.85;
  if (h >= 16 && h <= 21) return 0.95;
  if (h >= 2 && h <= 5) return 0.30;
  return 0.55;
}

// Gösterge paneli özeti (AI risk skoru + istatistikler) — hem REST hem WebSocket kullanır
export async function computeKpi(): Promise<KPIData> {
  const [total, cancelled, delayed, openDisruptions, affectedBookings, flights, weatherDisruptions, activeFlights] =
    await Promise.all([
      prisma.flight.count(),
      prisma.flight.count({ where: { status: "CANCELLED" } }),
      prisma.flight.count({ where: { status: "DELAYED" } }),
      prisma.disruption.count({ where: { resolved: false } }),
      prisma.booking.count({ where: { flight: { status: "CANCELLED" } } }),
      prisma.flight.findMany({
        select: { economyCap: true, businessCap: true, economyBooked: true, businessBooked: true },
      }),
      prisma.disruption.count({ where: { resolved: false, type: "WEATHER" } }),
      // Yakın 4 saatte İstanbul hub'dan kalkacak/varacak uçuş sayısı (hub yoğunluk proxy)
      prisma.flight.count({
        where: {
          status: { in: ["PLANNED", "BOARDING", "DELAYED"] },
          scheduledDep: {
            gte: new Date(),
            lt: new Date(Date.now() + 4 * 3600 * 1000),
          },
        },
      }),
    ]);

  const totCap = flights.reduce((s, f) => s + f.economyCap + f.businessCap, 0) || 1;
  const totBooked = flights.reduce((s, f) => s + f.economyBooked + f.businessBooked, 0);
  const avgLoadFactor = Math.min(1, totBooked / totCap);

  // Hava: WEATHER disruption varsa 0.5-0.75 arasında dalgalansın; yoksa 0.15-0.35
  // Gerçek üretimde OpenWeatherMap'ten saatlik gelir.
  const weatherBase = weatherDisruptions > 0 ? 0.6 : 0.25;
  const weatherSeverity = Math.max(0, Math.min(1, weatherBase + (Math.random() - 0.5) * 0.2));

  // Hub yoğunluğu: yaklaşan uçuş yoğunluğu + günün saati dalgalanması + etkilenen yolcu
  const hourly = diurnalLoad();
  const hubCongestion = Math.min(
    1,
    0.2 + activeFlights / 15 + hourly * 0.3 + affectedBookings / 800
  );

  const risk = (await getRiskScore({
    totalFlights: total,
    cancelled,
    delayed,
    avgLoadFactor,
    weatherSeverity,
    hubCongestion,
  })) as RiskScoreResult;

  return {
    riskIndex: risk.riskIndex,
    riskLevel: risk.level,
    riskFactors: risk.factors,
    riskSuggestions: risk.suggestions,
    riskSource: risk.source,
    totalFlights: total,
    cancelled,
    delayed,
    openDisruptions,
    affectedPassengers: affectedBookings,
    avgLoadFactor: Math.round(avgLoadFactor * 100),
    ts: Date.now(),
  };
}

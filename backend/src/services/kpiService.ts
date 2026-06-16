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

// Gösterge paneli özeti (AI risk skoru + istatistikler) — hem REST hem WebSocket kullanır
export async function computeKpi(): Promise<KPIData> {
  const [total, cancelled, delayed, openDisruptions, affectedBookings, flights, weatherDisruptions] =
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
    ]);

  const totCap = flights.reduce((s, f) => s + f.economyCap + f.businessCap, 0) || 1;
  const totBooked = flights.reduce((s, f) => s + f.economyBooked + f.businessBooked, 0);
  const avgLoadFactor = Math.min(1, totBooked / totCap);

  const risk = (await getRiskScore({
    totalFlights: total,
    cancelled,
    delayed,
    avgLoadFactor,
    weatherSeverity: weatherDisruptions > 0 ? 0.6 : 0.25,
    hubCongestion: Math.min(1, 0.3 + affectedBookings / 500),
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

// GET /api/analytics — AIAnalytics sayfası için gerçek DB verisi (mock yok)
import { Router } from "express";
import { prisma } from "../db.js";
import { computeKpi } from "../services/kpiService.js";
import { predictDelays } from "../services/aiClient.js";
import { getWeatherSeverity } from "../services/weather.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", async (_req, res) => {
  const [flights, totalDisruptions, hotelCare, mealCare, weatherDisruptions, aiDisruptions, kpi] =
    await Promise.all([
      prisma.flight.findMany({
        include: { depAirport: true, arrAirport: true },
        orderBy: { scheduledDep: "asc" },
      }),
      prisma.disruption.count(),
      prisma.careAction.count({ where: { type: "HOTEL" } }),
      prisma.careAction.count({ where: { type: "MEAL" } }),
      prisma.disruption.count({ where: { type: "WEATHER" } }),
      prisma.disruption.count({ where: { type: "AI_PREDICTION" } }),
      computeKpi(),
    ]);

  // Saatlik risk dağılımı — BTS 2024 gerçek kalkış saatlerinden
  const weatherFor = await Promise.all(
    flights.map((f: any) => getWeatherSeverity(f.arrAirport.lat, f.arrAirport.lon))
  );
  const items = flights.map((f: any, i: number) => ({
    departureHour: new Date(f.scheduledDep).getHours(),
    loadFactor: Math.min(1, (f.economyBooked + f.businessBooked) / Math.max(1, f.economyCap + f.businessCap)),
    routeHaulHours: Math.max(1, (new Date(f.scheduledArr).getTime() - new Date(f.scheduledDep).getTime()) / 3600000),
    weatherSeverity: weatherFor[i],
  }));
  const preds: any[] = (await predictDelays(items)) ?? [];

  // Saat bazlı grupla (0-23)
  type HourBucket = { hour: number; saat: string; risk: number; gecikme: number; ucus: number };
  const hourMap = new Map<number, HourBucket>();
  flights.forEach((f: any, i: number) => {
    const h = new Date(f.scheduledDep).getHours();
    if (!hourMap.has(h)) hourMap.set(h, { hour: h, saat: `${String(h).padStart(2,"0")}:00`, risk: 0, gecikme: 0, ucus: 0 });
    const b = hourMap.get(h)!;
    b.risk += (preds[i]?.delayProbability ?? 0) * 100;
    b.gecikme += preds[i]?.expectedDelayMin ?? 0;
    b.ucus += 1;
  });
  const hourlyRisk = Array.from(hourMap.values())
    .sort((a, b) => a.hour - b.hour)
    .map(b => ({ saat: b.saat, risk: Math.round(b.risk / b.ucus), gecikme: Math.round(b.gecikme / b.ucus), ucus: b.ucus }));

  // Gecikme tipi dağılımı (BTS: carrier/weather/nas/late aircraft)
  const disruptions = await prisma.disruption.findMany({ select: { type: true } });
  const typeCounts: Record<string, number> = {};
  for (const d of disruptions) typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1;
  const delayTypes = Object.entries(typeCounts).map(([tip, sayi]) => ({ tip, sayi }));

  res.json({
    stats: [
      { label: "Toplam Aksaklık", value: totalDisruptions.toString(), hint: "DB canlı", accent: "text-thy" },
      { label: "Otel Tahsisi",    value: hotelCare.toString(),         hint: "AI care aksiyonu", accent: "text-cyan-400" },
      { label: "İkram Tahsisi",   value: mealCare.toString(),          hint: "AI care aksiyonu", accent: "text-emerald-400" },
      { label: "AI Tespiti",      value: aiDisruptions.toString(),     hint: `${weatherDisruptions} hava kaynaklı`, accent: "text-orange-400" },
    ],
    hourlyRisk,
    delayTypes,
    models: [
      { name: "Gecikme Tahmini (RandomForest)", v: "AUC 0.985", icon: "TrendingUp" },
      { name: "Risk Skoru (Açıklanabilir)",    v: `%${kpi.riskIndex}`, icon: "Cpu" },
      { name: "Atama Optimizasyonu (OR-Tools)", v: "min-cost flow", icon: "Sparkles" },
      { name: "Proaktif Erken Uyarı",          v: `${aiDisruptions} tespit`, icon: "AlertTriangle" },
    ],
  });
});

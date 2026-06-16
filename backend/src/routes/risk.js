import { Router } from "express";
import { prisma } from "../db.js";
import { predictDelays } from "../services/aiClient.js";
import { getWeatherSeverity } from "../services/weather.js";

export const riskRouter = Router();

// GET /api/risk/flights — sıradaki uçuşların ML risk skoru (proaktif uyarı)
riskRouter.get("/flights", async (_req, res) => {
  const upcoming = await prisma.flight.findMany({
    where: { status: { in: ["PLANNED", "BOARDING", "DELAYED"] } },
    include: { depAirport: true, arrAirport: true },
    orderBy: { scheduledDep: "asc" },
    take: 30,
  });

  // Gerçek hava verisi (WEATHER_API_KEY varsa OpenWeatherMap; yoksa 0.3)
  const weatherFor = await Promise.all(
    upcoming.map((f) => getWeatherSeverity(f.arrAirport.lat, f.arrAirport.lon))
  );

  const items = upcoming.map((f, idx) => ({
    departureHour: new Date(f.scheduledDep).getHours(),
    loadFactor: Math.min(
      1,
      (f.economyBooked + f.businessBooked) / Math.max(1, f.economyCap + f.businessCap)
    ),
    routeHaulHours: Math.max(1, (f.scheduledArr - f.scheduledDep) / 3600000),
    weatherSeverity: weatherFor[idx],
  }));

  const preds = await predictDelays(items);
  const enriched = upcoming.map((f, i) => ({
    id: f.id,
    flightNo: f.flightNo,
    route: `${f.depAirport.iata} → ${f.arrAirport.iata}`,
    scheduledDep: f.scheduledDep,
    delayProbability: preds?.[i]?.delayProbability ?? null,
    expectedDelayMin: preds?.[i]?.expectedDelayMin ?? null,
    band: preds?.[i]?.band ?? null,
  }));

  enriched.sort((a, b) => (b.delayProbability ?? 0) - (a.delayProbability ?? 0));
  res.json({
    aiAvailable: !!preds,
    items: enriched,
  });
});

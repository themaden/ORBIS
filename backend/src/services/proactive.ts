// ORBIS — Proaktif AI Motoru
// Her 2 dakikada bir yaklaşan uçuşları AI ile tarar.
// Risk eşiği aşılırsa otomatik olarak:
//   1. DB'de disruption kaydı oluşturur
//   2. Yolcu atama + care öneri motorunu çalıştırır
//   3. Tüm bağlı istemcilere WebSocket "ai_alert" gönderir

import { prisma } from "../db.js";
import { predictDelays } from "./aiClient.js";
import { getWeatherSeverity } from "./weather.js";
import { recommendForDisruption } from "./recommend.js";
import type { Server } from "socket.io";

const RISK_THRESHOLD = 0.80;       // %80+ → otomatik disruption (düşük eşik alert fatigue yaratır)
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 dakika
const HORIZON_MS = 6 * 3600 * 1000;      // sonraki 6 saat

export function startProactiveEngine(io: Server): void {
  console.log("[proactive] AI erken uyarı motoru başlatıldı (2dk aralık, eşik %65)");

  const check = async () => {
    if (io.engine.clientsCount === 0) return;

    try {
      const upcoming = await prisma.flight.findMany({
        where: {
          status: { in: ["PLANNED", "BOARDING"] },
          scheduledDep: {
            gte: new Date(),
            lt: new Date(Date.now() + HORIZON_MS),
          },
        },
        include: { depAirport: true, arrAirport: true },
        orderBy: { scheduledDep: "asc" },
        take: 20,
      });

      if (upcoming.length === 0) return;

      const weatherFor = await Promise.all(
        upcoming.map((f: any) =>
          getWeatherSeverity(f.arrAirport.lat, f.arrAirport.lon)
        )
      );

      const items = upcoming.map((f: any, idx: number) => ({
        departureHour: new Date(f.scheduledDep).getHours(),
        loadFactor: Math.min(
          1,
          (f.economyBooked + f.businessBooked) /
            Math.max(1, f.economyCap + f.businessCap)
        ),
        routeHaulHours: Math.max(
          1,
          (f.scheduledArr - f.scheduledDep) / 3_600_000
        ),
        weatherSeverity: weatherFor[idx],
      }));

      const preds = await predictDelays(items);
      if (!preds) return;

      for (let i = 0; i < upcoming.length; i++) {
        const f = upcoming[i] as any;
        const pred = preds[i];
        if (!pred || pred.delayProbability < RISK_THRESHOLD) continue;

        // Zaten açık disruption var mı? (tekrarlamamak için)
        const existing = await prisma.disruption.findFirst({
          where: { flightId: f.id, resolved: false },
        });
        if (existing) continue;

        const reason =
          `AI erken uyarı: %${Math.round(pred.delayProbability * 100)} ` +
          `gecikme olasılığı — tahmini ~${pred.expectedDelayMin} dk, ` +
          `hava şiddeti ${Math.round(weatherFor[i] * 100)}%`;

        // DB'ye disruption yaz
        const disruption = await prisma.disruption.create({
          data: { flightId: f.id, type: "AI_PREDICTION", reason },
        });

        // Tahmin kaydı (doğruluk takibi için)
        await prisma.predictionLog.create({
          data: {
            flightId: f.id,
            predictedDelayMin: pred.expectedDelayMin,
            delayProbability: pred.delayProbability,
            band: pred.band ?? "Yüksek",
          },
        });

        // Uçuşu DELAYED olarak işaretle
        await prisma.flight.update({
          where: { id: f.id },
          data: { status: "DELAYED" },
        });

        // Yolcu atama + care öneri motorunu çalıştır
        let recommendation: Awaited<ReturnType<typeof recommendForDisruption>> | null = null;
        try {
          recommendation = await recommendForDisruption(disruption.id);
        } catch (e) {
          console.error("[proactive] öneri motoru hatası:", e);
        }

        const careCount = {
          hotel:
            recommendation?.passengers.filter(
              (p: any) => p.care?.type === "HOTEL"
            ).length ?? 0,
          meal:
            recommendation?.passengers.filter(
              (p: any) => p.care?.type === "MEAL"
            ).length ?? 0,
          refund:
            recommendation?.passengers.filter(
              (p: any) => p.care?.type === "REFUND"
            ).length ?? 0,
        };

        const alertPayload = {
          disruptionId: disruption.id,
          flightNo: f.flightNo,
          route: `${f.depAirport.iata} → ${f.arrAirport.iata}`,
          delayProbability: pred.delayProbability,
          expectedDelayMin: pred.expectedDelayMin,
          band: pred.band,
          reason,
          affectedCount: recommendation?.affectedCount ?? 0,
          careActions: careCount,
        };

        // Proaktif AI uyarısı (toast + irrops sayfası)
        io.emit("ai_alert", alertPayload);
        // disruption event → Irrops listesi otomatik yenilesin
        io.emit("disruption", alertPayload);

        console.log(
          `[proactive] ⚠ ${f.flightNo} — ` +
          `%${Math.round(pred.delayProbability * 100)} risk → ` +
          `disruption (${disruption.id.slice(0, 8)}) oluşturuldu, ` +
          `${recommendation?.affectedCount ?? 0} yolcu, ` +
          `otel:${careCount.hotel} ikram:${careCount.meal}`
        );
      }
    } catch (e) {
      console.error("[proactive] tarama hatası:", e);
    }
  };

  // İlk taramayı uygulama hazırlandıktan 30sn sonra başlat
  setTimeout(check, 30_000);
  setInterval(check, CHECK_INTERVAL_MS);
}

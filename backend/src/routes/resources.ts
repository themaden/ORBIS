import { Router } from "express";
import { prisma } from "../db.js";

export const resourcesRouter = Router();

// GET /api/resources/fleet — DB'deki filo durumu (Resources sayfası tablosu)
resourcesRouter.get("/fleet", async (_req, res) => {
  const flights = await prisma.flight.findMany({
    include: { aircraft: true, depAirport: true, arrAirport: true },
    orderBy: { scheduledDep: "asc" },
    take: 12,
  });

  const data = flights.map((f) => {
    const total = (f.economyCap + f.businessCap) || 1;
    const booked = f.economyBooked + f.businessBooked;
    const progress =
      f.status === "DEPARTED" || f.status === "ARRIVED"
        ? 100
        : Math.round((booked / total) * 100);
    return {
      code: f.aircraft?.tail ?? f.flightNo,
      model: f.aircraft?.model ?? "—",
      status:
        f.status === "PLANNED" ? "Kapıda" : f.status === "CANCELLED" ? "Bakımda" : "Uçuşta",
      route: `${f.depAirport.iata} → ${f.arrAirport.iata}`,
      progress,
    };
  });
  res.json(data);
});

// GET /api/resources/stats — DB sayımlarından canlı 4 stat kartı
resourcesRouter.get("/stats", async (_req, res) => {
  const [activeFlights, totalPassengers, hotelDisruptions, maintenance] =
    await Promise.all([
      prisma.flight.count({
        where: { status: { in: ["PLANNED", "BOARDING", "DELAYED", "DEPARTED"] } },
      }),
      prisma.passenger.count(),
      prisma.careAction.count({ where: { type: "HOTEL" } }),
      prisma.flight.count({ where: { status: "CANCELLED" } }),
    ]);

  res.json([
    {
      label: "Aktif Uçak",
      value: activeFlights.toString(),
      hint: "DB'den canlı",
      accent: "text-white",
    },
    {
      label: "Kayıtlı Yolcu",
      value: totalPassengers.toLocaleString("tr-TR"),
      hint: "Tüm rezervasyonlar",
      accent: "text-cyan-400",
    },
    {
      label: "Otel Tahsisi",
      value: hotelDisruptions.toString(),
      hint: "IRROPS care aksiyonu",
      accent: "text-emerald-400",
    },
    {
      label: "Aksaklık (İptal)",
      value: maintenance.toString(),
      hint: "Bakım/iptal uçuşları",
      accent: "text-thy",
    },
  ]);
});

// GET /api/resources/usage — DB'den hesaplı kapasite kullanımı (4 kategori)
resourcesRouter.get("/usage", async (_req, res) => {
  const flights = await prisma.flight.findMany({
    select: {
      economyCap: true,
      businessCap: true,
      economyBooked: true,
      businessBooked: true,
      status: true,
    },
  });

  const totCap = flights.reduce((s, f) => s + f.economyCap + f.businessCap, 0) || 1;
  const totBooked = flights.reduce((s, f) => s + f.economyBooked + f.businessBooked, 0);
  const planeUtil = Math.round((totBooked / totCap) * 100);

  const aircraftCount = await prisma.aircraft.count();
  const crewEstimate = aircraftCount * 12; // ~12 mürettebat/uçak makul
  const onDutyCrew = flights.filter((f) => f.status !== "CANCELLED").length * 8;
  const crewUtil = Math.min(100, Math.round((onDutyCrew / Math.max(crewEstimate, 1)) * 100));

  const hotelCount = await prisma.careAction.count({ where: { type: "HOTEL" } });
  const hotelUtil = Math.min(100, Math.round((hotelCount / 50) * 100)); // 50 oda kapasiteli varsayım

  const maintenance = await prisma.flight.count({ where: { status: "CANCELLED" } });
  const maintUtil = Math.min(100, Math.round((maintenance / Math.max(aircraftCount, 1)) * 100));

  res.json([
    { label: "Uçak kullanımı", v: planeUtil, icon: "Plane" },
    { label: "Mürettebat", v: crewUtil, icon: "Users" },
    { label: "Otel kontenjanı", v: hotelUtil, icon: "Hotel" },
    { label: "Bakım kapasitesi", v: maintUtil, icon: "Wrench" },
  ]);
});

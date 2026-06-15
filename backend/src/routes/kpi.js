import { Router } from "express";
import { prisma } from "../db.js";

export const kpiRouter = Router();

// GET /api/kpi/summary — gösterge paneli özeti (gauge + istatistikler)
kpiRouter.get("/summary", async (_req, res) => {
  const [total, cancelled, delayed, openDisruptions, affectedBookings] =
    await Promise.all([
      prisma.flight.count(),
      prisma.flight.count({ where: { status: "CANCELLED" } }),
      prisma.flight.count({ where: { status: "DELAYED" } }),
      prisma.disruption.count({ where: { resolved: false } }),
      prisma.booking.count({
        where: { flight: { status: "CANCELLED" } },
      }),
    ]);

  // Basit risk endeksi: iptal+gecikme oranından türetilmiş (0-100)
  const riskIndex = Math.min(
    95,
    Math.round(((cancelled * 2 + delayed) / Math.max(total, 1)) * 100) + 30
  );

  res.json({
    riskIndex,
    totalFlights: total,
    cancelled,
    delayed,
    openDisruptions,
    affectedPassengers: affectedBookings,
  });
});

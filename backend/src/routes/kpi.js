import { Router } from "express";
import { computeKpi } from "../services/kpiService.js";

export const kpiRouter = Router();

// GET /api/kpi/summary — gösterge paneli özeti (AI risk skoru + istatistikler)
kpiRouter.get("/summary", async (_req, res) => {
  res.json(await computeKpi());
});

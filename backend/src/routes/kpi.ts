import { Router, Request, Response } from "express";
import { computeKpi } from "../services/kpiService.js";

export const kpiRouter = Router();

// GET /api/kpi/summary — gösterge paneli özeti (AI risk skoru + istatistikler)
kpiRouter.get("/summary", async (_req: Request, res: Response) => {
  res.json(await computeKpi());
});

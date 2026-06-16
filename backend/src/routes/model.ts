import { Router, Request, Response } from "express";

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
export const modelRouter = Router();

// GET /api/model/info — AI servisinden ML model bilgisini proxy'ler
modelRouter.get("/info", async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${AI_URL}/model/info`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    res.json(await r.json());
  } catch {
    res.status(503).json({ error: "AI servisi (8000) erişilemiyor" });
  }
});

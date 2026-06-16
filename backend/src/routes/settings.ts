// GET/PUT /api/settings/params — maliyet parametreleri yönetimi (Admin)
// GET/POST /api/settings/model/* — AI model versiyonlama proxy
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AuthRequest } from "../types.js";

export const settingsRouter = Router();

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// GET /api/settings/params — tüm maliyet parametrelerini döner
settingsRouter.get("/params", requireAuth, async (_req: Request, res: Response) => {
  const params = await prisma.costParam.findMany({ orderBy: { key: "asc" } });
  res.json(params);
});

const UpdateParamsBody = z.object({
  updates: z.array(
    z.object({
      key: z.string().min(1),
      value: z.number().min(0).max(100_000),
    })
  ).min(1).max(20),
});

// PUT /api/settings/params — parametreleri toplu güncelle
settingsRouter.put(
  "/params",
  requireAuth,
  requireRole("IOCC", "ADMIN"),
  validate(UpdateParamsBody),
  async (req: AuthRequest, res: Response) => {
    const { updates } = req.body as any;
    const results = await Promise.all(
      updates.map((u: { key: string; value: number }) =>
        prisma.costParam.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    );
    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || "bilinmeyen",
        action: "settings.params.update",
        entity: "CostParam",
        meta: { updates } as any,
      },
    });
    res.json({ ok: true, updated: results.length });
  }
);

// GET /api/settings/model/versions — model versiyonlarını proxy'ler
settingsRouter.get("/model/versions", requireAuth, async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${AI_URL}/model/versions`, { signal: AbortSignal.timeout(5000) });
    res.json(await r.json());
  } catch {
    res.json([]);
  }
});

// GET /api/settings/model/accuracy — tahmin doğruluk istatistikleri
settingsRouter.get("/model/accuracy", requireAuth, async (_req: Request, res: Response) => {
  const [aiAccuracy, dbLogs] = await Promise.all([
    fetch(`${AI_URL}/model/accuracy`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .catch(() => null),
    prisma.predictionLog.findMany({
      where: { actualDelayMin: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  // DB'deki tahminlerden hesapla
  const n = dbLogs.length;
  const c30 = dbLogs.filter((l: any) => l.correct30 === true).length;
  const avgErr = n > 0
    ? dbLogs.reduce((s: number, l: any) => s + (l.absError ?? 0), 0) / n
    : 0;

  res.json({
    ai: aiAccuracy,
    db: {
      totalPredictions: await prisma.predictionLog.count(),
      verifiedCount: n,
      correctWithin30: c30,
      accuracy30: n > 0 ? Math.round((c30 / n) * 1000) / 1000 : null,
      avgAbsError: Math.round(avgErr * 10) / 10,
    },
  });
});

// POST /api/settings/model/retrain — yeniden eğitim başlat
settingsRouter.post(
  "/model/retrain",
  requireAuth,
  requireRole("IOCC", "ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const r = await fetch(`${AI_URL}/model/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxRows: req.body?.maxRows ?? 500_000, forceRetrain: true }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) throw new Error(`AI ${r.status}`);
      const data = await r.json();
      await prisma.auditLog.create({
        data: {
          actor: req.user?.name || "bilinmeyen",
          action: "model.retrain.triggered",
          entity: "DelayModel",
          meta: { maxRows: req.body?.maxRows ?? 500_000 } as any,
        },
      });
      res.json(data);
    } catch {
      res.status(503).json({ error: "AI servisi (8000) erişilemiyor veya eğitim zaten devam ediyor." });
    }
  }
);

// GET /api/settings/model/retrain/status — eğitim durumu
settingsRouter.get("/model/retrain/status", requireAuth, async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${AI_URL}/model/retrain/status`, { signal: AbortSignal.timeout(3000) });
    res.json(await r.json());
  } catch {
    res.json({ running: false, error: "AI servisi erişilemiyor" });
  }
});

// ---- GDPR ----

// GET /api/settings/gdpr/summary — kişisel veri özeti
settingsRouter.get("/gdpr/summary", requireAuth, requireRole("IOCC", "ADMIN"), async (_req, res) => {
  const [total, withEmail, withPhone, anonymized] = await Promise.all([
    prisma.passenger.count(),
    prisma.passenger.count({ where: { email: { not: null } } }),
    prisma.passenger.count({ where: { phone: { not: null } } }),
    prisma.passenger.count({ where: { fullName: { startsWith: "ANON-" } } }),
  ]);
  res.json({
    totalPassengers: total,
    withEmail,
    withPhone,
    anonymized,
    personalDataCount: withEmail + withPhone,
    gdprNote: "Yolcu verileri GDPR/KVKK kapsamında korunmaktadır. Anonimleştirme geri alınamaz.",
  });
});

// POST /api/settings/gdpr/anonymize/:id — tek yolcuyu anonimleştir
settingsRouter.post(
  "/gdpr/anonymize/:id",
  requireAuth,
  requireRole("IOCC", "ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const pax = await prisma.passenger.findUnique({ where: { id: req.params.id } });
    if (!pax) { res.status(404).json({ error: "Yolcu bulunamadı" }); return; }
    if ((pax as any).fullName.startsWith("ANON-")) {
      res.json({ ok: true, alreadyAnonymized: true }); return;
    }
    const anonId = `ANON-${req.params.id.slice(0, 8).toUpperCase()}`;
    await prisma.passenger.update({
      where: { id: req.params.id },
      data: { fullName: anonId, email: null, phone: null },
    });
    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || "bilinmeyen",
        action: "gdpr.anonymize",
        entity: `Passenger:${req.params.id}`,
        meta: { anonId } as any,
      },
    });
    res.json({ ok: true, anonId });
  }
);

// POST /api/settings/gdpr/anonymize-batch — toplu anonimleştir (test verisi vs)
settingsRouter.post(
  "/gdpr/anonymize-batch",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    const { filter } = req.body as any; // "all" | "no-booking"
    let ids: string[];
    if (filter === "no-booking") {
      const booked = (await prisma.booking.findMany({ select: { passengerId: true } })).map(
        (b: any) => b.passengerId
      );
      ids = (
        await prisma.passenger.findMany({
          where: { id: { notIn: booked }, fullName: { not: { startsWith: "ANON-" } } },
          select: { id: true },
        })
      ).map((p: any) => p.id);
    } else {
      ids = (
        await prisma.passenger.findMany({
          where: { fullName: { not: { startsWith: "ANON-" } } },
          select: { id: true },
        })
      ).map((p: any) => p.id);
    }
    let count = 0;
    for (const id of ids) {
      await prisma.passenger.update({
        where: { id },
        data: { fullName: `ANON-${id.slice(0, 8).toUpperCase()}`, email: null, phone: null },
      });
      count++;
    }
    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || "bilinmeyen",
        action: "gdpr.anonymize-batch",
        entity: "Passenger",
        meta: { count, filter } as any,
      },
    });
    res.json({ ok: true, anonymized: count });
  }
);

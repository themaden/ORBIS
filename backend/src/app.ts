import express, { Express, Request, Response, NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { router as apiRouter } from "./routes/index.js";
import { openapi } from "./openapi.js";
import { ApiOptions } from "./types.js";

export function createApp(opts: ApiOptions = {}): Express {
  const app = express();

  // Güvenlik başlıkları (Swagger UI'ın CSP'sini bozmayacak şekilde)
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: opts.origin || "*" }));
  app.use(express.json({ limit: "200kb" }));

  // Genel rate limit (1 dk'da 300 istek/IP)
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Auth uçları için ek sıkı limit (brute force koruması)
  app.use(
    "/api/auth",
    rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false })
  );

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "orbis-backend", time: new Date().toISOString() });
  });

  // Swagger UI + OpenAPI JSON
  app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapi));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, { customSiteTitle: "ORBIS API" })
  );

  app.use("/api", apiRouter);

  app.use((_req: Request, res: Response) => res.status(404).json({ error: "Bulunamadı" }));

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const dbDown = String(err?.message || "").includes("Can't reach database");
    if (!opts.silent) console.error("API hatası:", err?.message || err);
    res.status(dbDown ? 503 : 500).json({
      error: dbDown
        ? "Veritabanına ulaşılamıyor (Docker/Postgres çalışıyor mu?)"
        : "Sunucu hatası",
    });
  });

  return app;
}

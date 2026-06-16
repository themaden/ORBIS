// Express uygulamasını test edilebilir biçimde dışa açar (listen yok).
import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { router as apiRouter } from "./routes/index.js";
import { openapi } from "./openapi.js";

export function createApp(opts = {}) {
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

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "orbis-backend", time: new Date().toISOString() });
  });

  // Swagger UI + OpenAPI JSON
  app.get("/openapi.json", (_req, res) => res.json(openapi));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, { customSiteTitle: "ORBIS API" })
  );

  app.use("/api", apiRouter);

  app.use((_req, res) => res.status(404).json({ error: "Bulunamadı" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const dbDown = String(err?.message || "").includes("Can't reach database");
    if (!opts.silent) console.error("API hatası:", err?.message || err);
    res.status(dbDown ? 503 : 500).json({
      error: dbDown ? "Veritabanına ulaşılamıyor (Docker/Postgres çalışıyor mu?)" : "Sunucu hatası",
    });
  });

  return app;
}

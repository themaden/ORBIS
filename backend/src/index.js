import express from "express";
import "express-async-errors"; // async route hatalarını error middleware'e taşır
import cors from "cors";
import dotenv from "dotenv";
import { router as apiRouter } from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// Sağlık kontrolü
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "orbis-backend", time: new Date().toISOString() });
});

// API uç noktaları
app.use("/api", apiRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Bulunamadı" }));

// Hata yakalama (DB kapalıysa çökmek yerine 503 döner)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const dbDown = String(err?.message || "").includes("Can't reach database");
  console.error("API hatası:", err?.message || err);
  res.status(dbDown ? 503 : 500).json({
    error: dbDown ? "Veritabanına ulaşılamıyor (Docker/Postgres çalışıyor mu?)" : "Sunucu hatası",
  });
});

app.listen(PORT, () => {
  console.log(`🛫 ORBIS backend çalışıyor → http://localhost:${PORT}`);
});

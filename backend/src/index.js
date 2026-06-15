import express from "express";
import "express-async-errors"; // async route hatalarını error middleware'e taşır
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { router as apiRouter } from "./routes/index.js";
import { computeKpi } from "./services/kpiService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || "*";

app.use(cors({ origin: ORIGIN }));
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

// HTTP + WebSocket sunucusu
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: ORIGIN } });

io.on("connection", async (socket) => {
  // Bağlanan istemciye anlık KPI gönder
  try {
    socket.emit("kpi", await computeKpi());
  } catch {
    /* DB/AI kapalı olabilir */
  }
});

// Tüm istemcilere periyodik canlı KPI yayını
setInterval(async () => {
  if (io.engine.clientsCount === 0) return;
  try {
    io.emit("kpi", await computeKpi());
  } catch {
    /* sessiz geç */
  }
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`🛫 ORBIS backend + WebSocket çalışıyor → http://localhost:${PORT}`);
});

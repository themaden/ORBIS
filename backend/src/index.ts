import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { computeKpi } from "./services/kpiService.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || "*";

const app = createApp({ origin: String(ORIGIN) });

// HTTP + WebSocket sunucusu
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: String(ORIGIN) } });

app.set("io", io);

io.on("connection", async (socket) => {
  try {
    socket.emit("kpi", await computeKpi());
  } catch {
    /* DB/AI kapalı */
  }
});

setInterval(async () => {
  if (io.engine.clientsCount === 0) return;
  try {
    io.emit("kpi", await computeKpi());
  } catch {
    /* sessiz */
  }
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`🛫 ORBIS backend + WebSocket çalışıyor → http://localhost:${PORT}`);
});

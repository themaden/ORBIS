// Tek API erişim noktası. Şu an mock veriyi async olarak döndürür.
// Backend hazır olunca yalnızca buradaki gövdeler `fetch(...)` ile değişecek;
// bileşenler değişmeden çalışmaya devam eder.
import * as mock from "./mockData";

const LATENCY = 350; // gerçekçi yükleme hissi için yapay gecikme

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolve(data, ms = LATENCY) {
  await delay(ms);
  // referans paylaşımını önlemek için kopyala
  return JSON.parse(JSON.stringify(data));
}

// Canlı kriz akışı simülasyonu: risk endeksini periyodik olarak hafifçe
// oynatır (rastgele yürüyüş). Backend gelince burası WebSocket aboneliğine
// dönüşecek; tüketici arayüz (RightPanel) değişmeyecek.
function subscribeCrisis(onUpdate, intervalMs = 4000) {
  let risk = mock.crisis.riskIndex;
  const id = setInterval(() => {
    const step = Math.round((Math.random() - 0.5) * 10);
    risk = Math.max(55, Math.min(92, risk + step));
    onUpdate({ ...mock.crisis, riskIndex: risk, updatedAt: Date.now() });
  }, intervalMs);
  return () => clearInterval(id);
}

export const api = {
  getCrisis: () => resolve(mock.crisis),
  getFleet: () => resolve(mock.fleet),
  getResourceStats: () => resolve(mock.resourceStats),
  getResourceUsage: () => resolve(mock.resourceUsage),
  getAnalytics: () => resolve(mock.analytics),
  subscribeCrisis,
};

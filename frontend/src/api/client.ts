// Tek API erişim noktası. Şu an mock veriyi async olarak döndürür.
// Backend hazır olunca yalnızca buradaki gövdeler `fetch(...)` ile değişecek;
// bileşenler değişmeden çalışmaya devam eder.
import * as mock from "./mockData";
import type {
  Crisis,
  FleetItem,
  StatItem,
  ResourceUsageItem,
  Analytics,
  CommsSeed,
} from "../types";

const LATENCY = 350; // gerçekçi yükleme hissi için yapay gecikme

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function resolve<T>(data: T, ms = LATENCY): Promise<T> {
  await delay(ms);
  // referans paylaşımını önlemek için kopyala
  return JSON.parse(JSON.stringify(data)) as T;
}

// Canlı kriz akışı simülasyonu: risk endeksini periyodik olarak hafifçe
// oynatır (rastgele yürüyüş). Backend gelince burası WebSocket aboneliğine
// dönüşecek; tüketici arayüz (RightPanel) değişmeyecek.
function subscribeCrisis(
  onUpdate: (c: Crisis) => void,
  intervalMs = 4000
): () => void {
  let risk = mock.crisis.riskIndex;
  const id = setInterval(() => {
    const step = Math.round((Math.random() - 0.5) * 10);
    risk = Math.max(55, Math.min(92, risk + step));
    onUpdate({ ...mock.crisis, riskIndex: risk, updatedAt: Date.now() });
  }, intervalMs);
  return () => clearInterval(id);
}

export const api = {
  getCrisis: (): Promise<Crisis> => resolve(mock.crisis),
  getFleet: (): Promise<FleetItem[]> => resolve(mock.fleet),
  getResourceStats: (): Promise<StatItem[]> => resolve(mock.resourceStats),
  getResourceUsage: (): Promise<ResourceUsageItem[]> => resolve(mock.resourceUsage),
  getAnalytics: (): Promise<Analytics> => resolve(mock.analytics),
  getCommsSeed: (): Promise<CommsSeed> => resolve(mock.comms),
  subscribeCrisis,
};

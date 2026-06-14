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

export const api = {
  getCrisis: () => resolve(mock.crisis),
  getFleet: () => resolve(mock.fleet),
  getResourceStats: () => resolve(mock.resourceStats),
  getResourceUsage: () => resolve(mock.resourceUsage),
  getAnalytics: () => resolve(mock.analytics),
};

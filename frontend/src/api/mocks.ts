// Backend kapalıyken (Vercel demo modu) kullanılan sahte veri katmanı.
// http.ts ağ hatası aldığında bu modülden cevap döner.

const now = new Date();
const isoIn = (mins: number) => new Date(now.getTime() + mins * 60_000).toISOString();

const FLIGHTS = [
  { id: "f1", flightNo: "TK1981", status: "BOARDING",  scheduledDep: isoIn(15),  delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "FRA", city: "Frankfurt" } },
  { id: "f2", flightNo: "TK1745", status: "DELAYED",   scheduledDep: isoIn(45),  delayMin: 42,
    depAirport: { iata: "IST" }, arrAirport: { iata: "LHR", city: "London" } },
  { id: "f3", flightNo: "TK0009", status: "PLANNED",   scheduledDep: isoIn(90),  delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "JFK", city: "New York" } },
  { id: "f4", flightNo: "TK2618", status: "DELAYED",   scheduledDep: isoIn(120), delayMin: 75,
    depAirport: { iata: "IST" }, arrAirport: { iata: "CDG", city: "Paris" } },
  { id: "f5", flightNo: "TK0058", status: "PLANNED",   scheduledDep: isoIn(180), delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "DXB", city: "Dubai" } },
  { id: "f6", flightNo: "TK0079", status: "PLANNED",   scheduledDep: isoIn(220), delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "SIN", city: "Singapore" } },
  { id: "f7", flightNo: "TK1853", status: "DELAYED",   scheduledDep: isoIn(35),  delayMin: 28,
    depAirport: { iata: "IST" }, arrAirport: { iata: "AMS", city: "Amsterdam" } },
  { id: "f8", flightNo: "TK1721", status: "PLANNED",   scheduledDep: isoIn(75),  delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "MAD", city: "Madrid" } },
  { id: "f9", flightNo: "TK0701", status: "PLANNED",   scheduledDep: isoIn(150), delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "NRT", city: "Tokyo" } },
  { id: "f10",flightNo: "TK0205", status: "BOARDING",  scheduledDep: isoIn(10),  delayMin: 0,
    depAirport: { iata: "IST" }, arrAirport: { iata: "ESB", city: "Ankara" } },
];

const RISK_ITEMS = FLIGHTS.map((f, i) => ({
  id: f.id,
  flightNo: f.flightNo,
  route: `${f.depAirport.iata}-${f.arrAirport.iata}`,
  scheduledDep: f.scheduledDep,
  delayProbability: [0.78, 0.91, 0.22, 0.85, 0.31, 0.18, 0.67, 0.29, 0.41, 0.12][i] ?? 0.3,
  expectedDelayMin: [35, 60, 5, 50, 10, 0, 25, 8, 15, 0][i] ?? 0,
  band: ["HIGH", "HIGH", "LOW", "HIGH", "MED", "LOW", "MED", "LOW", "MED", "LOW"][i] ?? "LOW",
}));

const KPI = {
  riskIndex: 0.62,
  riskLevel: "ORTA",
  riskFactors: [
    { name: "Hava (IST fırtına)", contribution: 0.34 },
    { name: "Trafik yoğunluğu",  contribution: 0.21 },
    { name: "Late aircraft",     contribution: 0.18 },
    { name: "Crew availability", contribution: 0.09 },
  ],
  riskSuggestions: [
    "TK1745 ve TK2618 için crew yedeği hazırlanmalı.",
    "Frankfurt ve Londra rotalarında 30-60 dk slip riski yüksek.",
    "Hub'da gate doluluğu izlenmeli.",
  ],
  riskSource: "ORBIS AI (mock demo)",
  totalFlights: 248,
  cancelled: 3,
  delayed: 27,
  openDisruptions: 4,
  affectedPassengers: 612,
  avgLoadFactor: 0.84,
};

const DISRUPTIONS = [
  { id: "d1", type: "DELAY", reason: "Hava muhalefeti (IST)", startedAt: isoIn(-20), resolved: false,
    flight: { flightNo: "TK1745",
      depAirport: { iata: "IST", city: "İstanbul" },
      arrAirport: { iata: "LHR", city: "London" } } },
  { id: "d2", type: "DELAY", reason: "Late aircraft", startedAt: isoIn(-45), resolved: false,
    flight: { flightNo: "TK2618",
      depAirport: { iata: "IST", city: "İstanbul" },
      arrAirport: { iata: "CDG", city: "Paris" } } },
  { id: "d3", type: "CANCEL", reason: "Teknik arıza", startedAt: isoIn(-90), resolved: false,
    flight: { flightNo: "TK1853",
      depAirport: { iata: "IST", city: "İstanbul" },
      arrAirport: { iata: "AMS", city: "Amsterdam" } } },
  { id: "d4", type: "DELAY", reason: "ATC slot", startedAt: isoIn(-12), resolved: false,
    flight: { flightNo: "TK1981",
      depAirport: { iata: "IST", city: "İstanbul" },
      arrAirport: { iata: "FRA", city: "Frankfurt" } } },
];

const ANALYTICS = {
  stats: [
    { label: "Bugün Tahmin",     value: "248",  hint: "uçuş",       accent: "cyan"    },
    { label: "Ortalama Hata",    value: "12dk", hint: "MAE",        accent: "emerald" },
    { label: "Doğruluk (±30dk)", value: "%87",  hint: "son 7 gün",  accent: "violet"  },
    { label: "Açık Aksaklık",    value: "4",    hint: "şu an",      accent: "orange"  },
  ],
  hourlyRisk: Array.from({ length: 24 }, (_, h) => ({
    saat: `${String(h).padStart(2, "0")}:00`,
    risk: Math.round((30 + 40 * Math.sin(h / 3) + Math.random() * 10) * 10) / 10,
    gecikme: Math.round(10 + 30 * Math.abs(Math.sin(h / 4))),
    ucus: Math.round(8 + 6 * Math.abs(Math.cos(h / 5))),
  })),
  delayTypes: [
    { tip: "Late aircraft", sayi: 38 },
    { tip: "Weather",       sayi: 22 },
    { tip: "Carrier",       sayi: 17 },
    { tip: "NAS",           sayi: 9  },
    { tip: "Security",      sayi: 2  },
  ],
  models: [
    { name: "Delay Classifier", v: "v1.4", icon: "shield" },
    { name: "Delay Regressor",  v: "v1.4", icon: "chart"  },
    { name: "Care Recommender", v: "v0.8", icon: "users"  },
  ],
};

const MODEL_INFO = {
  delayModel: "XGBoost + LightGBM ensemble",
  dataSource: "BTS 2024 (US DOT) — 7.1M satır",
  note: "Demo modeli; üretimde havayolu verisiyle yeniden kalibre edilir.",
  maeMin: 11.8, rmseMin: 18.3, auc: 0.882,
  precision: 0.84, recall: 0.79, f1: 0.81,
  confusion: { tp: 1843, fp: 351, tn: 4912, fn: 487 },
  featureImportances: {
    crs_dep_time: 0.21, distance: 0.14, origin: 0.12,
    dest: 0.11, op_unique_carrier: 0.10, day_of_week: 0.08,
    month: 0.07, taxi_out: 0.06, late_aircraft_delay: 0.06, weather_delay: 0.05,
  },
  nTrain: 5_680_000, nTest: 1_420_000,
};

const FLEET = [
  { code: "TC-JJM", model: "B777-300ER", status: "InFlight",  route: "IST-JFK", progress: 62, flightNo: "TK0009", loadPct: 88 },
  { code: "TC-LSP", model: "A350-900",   status: "AtGate",    route: "IST-FRA", progress: 0,  flightNo: "TK1981", loadPct: 91 },
  { code: "TC-JFE", model: "B737-800",   status: "Delayed",   route: "IST-LHR", progress: 0,  flightNo: "TK1745", loadPct: 76 },
  { code: "TC-LJD", model: "A321neo",    status: "InFlight",  route: "IST-CDG", progress: 41, flightNo: "TK1827", loadPct: 82 },
  { code: "TC-LJG", model: "A321neo",    status: "AtGate",    route: "IST-AMS", progress: 0,  flightNo: "TK1853", loadPct: 68 },
];

const RESOURCE_STATS = [
  { label: "Aktif Uçak",  value: "248",   hint: "filoda",    accent: "cyan"    },
  { label: "Pilot",       value: "1,820", hint: "görevde",   accent: "violet"  },
  { label: "Kabin Ekibi", value: "4,610", hint: "görevde",   accent: "emerald" },
  { label: "Yedek Slot",  value: "12",    hint: "boşta",     accent: "orange"  },
];

const RESOURCE_USAGE = [
  { label: "Uçak doluluk",  v: 84, icon: "plane"   },
  { label: "Pilot kullanım",v: 71, icon: "user"    },
  { label: "Gate doluluk",  v: 92, icon: "door"    },
  { label: "Yer ekibi",     v: 67, icon: "wrench"  },
];

const MODEL_VERSIONS = [
  { version: "v1.4", trainedAt: isoIn(-60 * 24 * 3),  source: "BTS 2024", mae: 11.8, rmse: 18.3, auc: 0.882, f1: 0.81, nTrain: 5_680_000, nTest: 1_420_000, active: true  },
  { version: "v1.3", trainedAt: isoIn(-60 * 24 * 10), source: "BTS 2024", mae: 12.6, rmse: 19.1, auc: 0.871, f1: 0.79, nTrain: 5_120_000, nTest: 1_280_000, active: false },
  { version: "v1.2", trainedAt: isoIn(-60 * 24 * 18), source: "BTS 2024", mae: 13.2, rmse: 20.0, auc: 0.860, f1: 0.77, nTrain: 4_800_000, nTest: 1_200_000, active: false },
];

const ACCURACY_STATS = {
  ai: { totalPredictions: 12480, correctWithin30Min: 10858, accuracy30: 0.87, avgAbsError: 11.8 },
  db: { totalPredictions: 12480, verifiedCount: 9120, correctWithin30: 7935, accuracy30: 0.87, avgAbsError: 12.1 },
};

const GDPR_SUMMARY = {
  totalPassengers: 38_420, withEmail: 36_104, withPhone: 33_980,
  anonymized: 1_240, personalDataCount: 37_180,
  gdprNote: "Demo modu — gerçek kişisel veri yok, üretimde KVKK + GDPR uyumlu.",
};

// ─────────────────────────────────────────────────────────────
// Path → mock data eşleme
// ─────────────────────────────────────────────────────────────

export function getMock(path: string): unknown | undefined {
  if (path === "/api/flights")            return FLIGHTS;
  if (path === "/api/risk/flights")       return { aiAvailable: true, items: RISK_ITEMS };
  if (path === "/api/kpi/summary")        return KPI;
  if (path === "/api/disruptions")        return DISRUPTIONS;
  if (path === "/api/analytics")          return ANALYTICS;
  if (path === "/api/model/info")         return MODEL_INFO;
  if (path === "/api/resources/fleet")    return FLEET;
  if (path === "/api/resources/stats")    return RESOURCE_STATS;
  if (path === "/api/resources/usage")    return RESOURCE_USAGE;
  if (path === "/api/settings/model/versions") return MODEL_VERSIONS;
  if (path === "/api/settings/model/accuracy") return ACCURACY_STATS;
  if (path === "/api/settings/gdpr/summary")   return GDPR_SUMMARY;
  if (path === "/api/settings/params")     return [];
  if (path.startsWith("/api/disruptions/") && path.endsWith("/recommend")) {
    return { ok: false, message: "Demo modu — öneri için backend gerekli." };
  }
  return undefined;
}

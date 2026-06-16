// Explainability API — SHAP yerine hafif local explainer endpoint'leri.
// Backend: FastAPI (ai servisi) üzerindeki /explain/* rotaları.
const AI_BASE = import.meta.env.VITE_AI_URL || "http://localhost:8000";

// ---- Tipler ----

export interface ExplanationFeature {
  name: string;
  value: number;       // normalize edilmiş girdi (0-1)
  importance: number;  // global feature importance
  contribution: number; // local katkı büyüklüğü
  direction: string;   // "↑ arttırıyor" | "↓ azaltıyor" | "→ etkisiz"
}

export interface DelayExplanation {
  prediction: number;           // tahmini gecikme dakika
  probability: number;          // gecikme olasılığı (0-1)
  features: ExplanationFeature[];
  top_factor: string;           // en etkili faktör
  band: string;                 // "Yüksek" / "Orta" / "Düşük"
  insight: string;              // insan tarafından okunabilir açıklama
}

export interface ExplainRequest {
  departureHour: number;
  loadFactor: number;
  routeHaulHours: number;
  weatherSeverity: number;
}

export interface PartialDependenceItem {
  feature_value: number;
  prediction_min: number;
  probability: number;
}

export interface PartialDependenceResponse {
  feature: string;
  values: PartialDependenceItem[];
}

export interface FeatureImportanceResponse {
  importances: Record<string, number>;
  note: string;
  ranking: [string, number][];
}

// ---- API Çağrıları ----

export async function explainDelay(req: ExplainRequest): Promise<DelayExplanation> {
  const r = await fetch(`${AI_BASE}/explain/delay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error(`Explain API ${r.status}`);
  return (await r.json()) as DelayExplanation;
}

export async function getPartialDependence(feature: string): Promise<PartialDependenceResponse> {
  const r = await fetch(`${AI_BASE}/explain/partial-dependence/${feature}`);
  if (!r.ok) throw new Error(`PD API ${r.status}`);
  return (await r.json()) as PartialDependenceResponse;
}

export async function getFeatureImportance(): Promise<FeatureImportanceResponse> {
  const r = await fetch(`${AI_BASE}/explain/feature-importance`);
  if (!r.ok) throw new Error(`FI API ${r.status}`);
  return (await r.json()) as FeatureImportanceResponse;
}

// Tüm feature'lar için PD verisi toplu çekme
export const PD_FEATURES = ["departureHour", "loadFactor", "routeHaulHours", "weatherSeverity"] as const;
export type PDFeature = (typeof PD_FEATURES)[number];

export const FEATURE_LABELS: Record<string, string> = {
  departureHour: "Kalkış Saati",
  loadFactor: "Doluluk Oranı",
  routeHaulHours: "Rota Süresi",
  weatherSeverity: "Hava Şiddeti",
  carrierDelay: "Taşıyıcı Gecikmesi",
  nasDelay: "Hava Trafik Gecikmesi",
  lateAircraftDelay: "Geç Uçak Gecikmesi",
  dayOfWeek: "Haftanın Günü",
  month: "Ay",
};

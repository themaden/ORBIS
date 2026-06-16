// AI servisi (FastAPI) istemcisi.
// Servis erişilemezse basit bir yerel hesaba düşer (graceful fallback).

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export interface OptimalAssignmentPayload {
  passengers: Array<{ passengerId: string; ticketClass: string; priority: number }>;
  alternatives: Array<{
    flightId: string;
    economyAvail: number;
    businessAvail: number;
    addedDelayMin: number;
  }>;
}

export interface OptimalAssignmentResult {
  assignments: Array<{
    passengerId: string;
    toFlightId?: string;
  }>;
}

// Optimal yolcu→uçuş ataması (AI min-cost flow). Kapalıysa null döner (greedy'ye düşülür).
export async function getOptimalAssignment(
  payload: OptimalAssignmentPayload
): Promise<OptimalAssignmentResult | null> {
  try {
    const r = await fetch(`${AI_URL}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    return (await r.json()) as OptimalAssignmentResult;
  } catch {
    return null;
  }
}

export interface DelayPredictionItem {
  departureHour: number;
  loadFactor: number;
  routeHaulHours: number;
  weatherSeverity: number;
}

export interface DelayPrediction {
  expectedDelayMin: number;
  delayProbability: number;
  band: string;
}

// Alternatif uçuşlar için toplu ML gecikme tahmini. Kapalıysa null.
export async function predictDelays(items: DelayPredictionItem[]): Promise<DelayPrediction[] | null> {
  try {
    const r = await fetch(`${AI_URL}/predict/delay/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    const data = (await r.json()) as any;
    return data.predictions as DelayPrediction[];
  } catch {
    return null;
  }
}

export interface RiskSnapshot {
  totalFlights: number;
  cancelled: number;
  delayed: number;
  avgLoadFactor: number;
  weatherSeverity: number;
  hubCongestion: number;
}

export interface RiskScoreResult {
  riskIndex: number;
  level: string;
  factors: string[];
  suggestions: string[];
  source: string;
}

// IRROPS risk skoru — AI servisinden, kapalıysa yerel heuristik
export async function getRiskScore(snapshot: RiskSnapshot): Promise<RiskScoreResult> {
  try {
    const r = await fetch(`${AI_URL}/risk/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    return (await r.json()) as RiskScoreResult;
  } catch {
    const { totalFlights = 1, cancelled = 0, delayed = 0 } = snapshot;
    const riskIndex = Math.min(
      95,
      Math.round(((cancelled * 2 + delayed) / Math.max(totalFlights, 1)) * 100) + 30
    );
    return {
      riskIndex,
      level: riskIndex >= 66 ? "Yüksek" : riskIndex >= 40 ? "Orta" : "Düşük",
      factors: [],
      suggestions: [],
      source: "fallback",
    };
  }
}

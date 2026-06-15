// AI servisi (FastAPI) istemcisi.
// Servis erişilemezse basit bir yerel hesaba düşer (graceful fallback).

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Optimal yolcu→uçuş ataması (AI min-cost flow). Kapalıysa null döner (greedy'ye düşülür).
export async function getOptimalAssignment(payload) {
  try {
    const r = await fetch(`${AI_URL}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    return await r.json();
  } catch {
    return null;
  }
}

// IRROPS risk skoru — AI servisinden, kapalıysa yerel heuristik
export async function getRiskScore(snapshot) {
  try {
    const r = await fetch(`${AI_URL}/risk/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    return await r.json();
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

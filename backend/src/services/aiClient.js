// AI servisi (FastAPI) istemcisi.
// Servis erişilemezse basit bir yerel hesaba düşer (graceful fallback).

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

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

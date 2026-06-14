// AI servisi (FastAPI) istemcisi.
// Servis erişilemezse basit bir yerel tahmine düşer (graceful fallback).

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function getCrisisForecast(payload) {
  try {
    const r = await fetch(`${AI_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    return await r.json();
  } catch {
    // AI servisi henüz hazır değil — yer tutucu tahmin döndür
    return localFallback(payload);
  }
}

function localFallback({ flights = [] }) {
  const totalDelay = flights.reduce((s, f) => s + (f.delayMin || 0), 0);
  const riskIndex = Math.min(95, 40 + Math.round(totalDelay / 10));
  return {
    source: "fallback",
    riskIndex,
    delays: [
      { region: "Avrupa", level: "Yüksek", extraHours: 2.5 },
      { region: "Asya", level: "Orta", extraHours: 1 },
    ],
    suggestions: [
      "Yaklaşan fırtına nedeniyle Londra'da 50 otel odasını önceden ayırın.",
      "Hava sistemini aşmak için uçuşları Orta Avrupa üzerinden yeniden yönlendirin.",
    ],
  };
}

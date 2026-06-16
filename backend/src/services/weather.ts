// OpenWeatherMap entegrasyonu (opsiyonel).
// WEATHER_API_KEY varsa şehir koordinatına göre hava şiddetini 0-1 ölçeğine
// çevirir; yoksa sabit makul varsayım döndürür.

const KEY = process.env.WEATHER_API_KEY;
const cache = new Map<string, { value: number; ts: number }>();
const TTL = 10 * 60 * 1000; // 10 dk

export async function getWeatherSeverity(lat: number, lon: number): Promise<number> {
  if (!KEY) return 0.3; // varsayılan

  const k = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(k);
  if (hit && Date.now() - hit.ts < TTL) return hit.value;

  try {
    const r = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!r.ok) throw new Error(`OWM ${r.status}`);
    const data = (await r.json()) as any;

    // Basit ölçek: rüzgar, yağış, görüş, fırtına kodu
    const wind = Math.min(1, (data.wind?.speed || 0) / 25); // 25 m/s = max
    const rain = Math.min(1, (data.rain?.["1h"] || 0) / 10);
    const snow = Math.min(1, (data.snow?.["1h"] || 0) / 5);
    const stormy = (data.weather?.[0]?.id ?? 800) < 700 ? 0.5 : 0;
    const severity = Math.min(1, 0.2 * wind + 0.4 * rain + 0.5 * snow + stormy);

    cache.set(k, { value: severity, ts: Date.now() });
    return severity;
  } catch {
    return 0.3;
  }
}

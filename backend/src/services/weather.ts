// Hava durumu servisi — Open-Meteo (ücretsiz, API key gerektirmez)
// Fallback: OpenWeatherMap (WEATHER_API_KEY varsa)
//
// Uçuş operasyonlarını etkileyen 5 faktör:
//   rüzgar (m/s) · yağış (mm/h) · kar · görüş bozukluğu · fırtına kodu
// Hepsi 0-1 ölçeğine normalleştirilerek birleştirilir.

const OWM_KEY = process.env.WEATHER_API_KEY;

// 15 dakika TTL — sık çağrılarda gereksiz istek yapmaz
const cache = new Map<string, { value: number; ts: number }>();
const TTL = 15 * 60 * 1000;

// Open-Meteo WMO hava kodu → şiddet katsayısı
// https://open-meteo.com/en/docs#weathervariables
function wmoToSeverity(code: number): number {
  if (code >= 95) return 1.0;   // fırtına, dolu, şimşek
  if (code >= 80) return 0.75;  // sağanak
  if (code >= 71) return 0.65;  // kar fırtınası
  if (code >= 61) return 0.55;  // yağmur
  if (code >= 51) return 0.35;  // çisenti
  if (code >= 45) return 0.3;   // sis/kırağı
  return 0;
}

async function openMeteo(lat: number, lon: number): Promise<number> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
    `&current=weathercode,windspeed_10m,precipitation,visibility,snowfall` +
    `&windspeed_unit=ms&timezone=auto`;

  const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  const d = (await r.json()) as any;
  const c = d.current;

  const wind       = Math.min(1, (c.windspeed_10m   ?? 0) / 28);  // 28 m/s = şiddetli fırtına
  const rain       = Math.min(1, (c.precipitation   ?? 0) / 15);  // 15 mm/h = aşırı yağış
  const snow       = Math.min(1, (c.snowfall        ?? 0) / 5);   // 5 cm/h = yoğun kar
  const vis        = c.visibility != null ? Math.max(0, 1 - c.visibility / 10_000) : 0; // 10km = tam görüş
  const wmo        = wmoToSeverity(c.weathercode    ?? 0);

  // Ağırlıklı birleşim — fırtına + kar uçuşa en çok etki eder
  return Math.min(1, wind * 0.25 + rain * 0.20 + snow * 0.25 + vis * 0.10 + wmo * 0.20);
}

async function openWeatherMap(lat: number, lon: number): Promise<number> {
  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`,
    { signal: AbortSignal.timeout(3000) }
  );
  if (!r.ok) throw new Error(`OWM ${r.status}`);
  const d = (await r.json()) as any;

  const wind  = Math.min(1, (d.wind?.speed ?? 0) / 25);
  const rain  = Math.min(1, (d.rain?.["1h"] ?? 0) / 10);
  const snow  = Math.min(1, (d.snow?.["1h"] ?? 0) / 5);
  const stormy = (d.weather?.[0]?.id ?? 800) < 700 ? 0.5 : 0;
  return Math.min(1, wind * 0.2 + rain * 0.4 + snow * 0.5 + stormy);
}

export async function getWeatherSeverity(lat: number, lon: number): Promise<number> {
  const k = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(k);
  if (hit && Date.now() - hit.ts < TTL) return hit.value;

  let value = 0.25; // makul varsayılan (tamamen sakin hava)

  try {
    // Öncelik: ücretsiz Open-Meteo (her zaman dene)
    value = await openMeteo(lat, lon);
  } catch {
    if (OWM_KEY) {
      try {
        value = await openWeatherMap(lat, lon);
      } catch {
        // İkisi de başarısız — varsayılan kullan
      }
    }
  }

  cache.set(k, { value, ts: Date.now() });
  return value;
}

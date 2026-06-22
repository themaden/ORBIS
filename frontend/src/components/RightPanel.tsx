// RightPanel — Yapay Zeka Kriz Tahmincisi
// Tüm veriler LiveDataContext'ten: KPI risk skoru, ML gecikme tahminleri, proaktif ai_alert.
// Kendi WebSocket/API çağrısı yok — merkezi haber bandı mantığı.
import { useEffect, useState } from "react";
import { useLiveData } from "../context/useLiveData";
import type { RiskFlightItem } from "../api/irrops";
import { Skeleton, ErrorState } from "./Skeleton";
import { polar, arcPath as arc, valueToRatio } from "../lib/gauge";
import type { DelayLevel } from "../types";

const bandColor = (p: number) =>
  p >= 0.65 ? "text-thy" : p >= 0.4 ? "text-orange-400" : "text-emerald-400";

const bandLabel = (p: number): DelayLevel =>
  p >= 0.65 ? "Yüksek" : p >= 0.4 ? "Orta" : "Düşük";

function flightSuggestion(f: RiskFlightItem): string {
  const p = f.delayProbability ?? 0;
  const min = f.expectedDelayMin ?? 0;
  const route = f.route ?? "";
  if (p >= 0.75)
    return `${f.flightNo} (${route}): Yolcu bildirimi ve kapı değişikliği hazırlığı başlatın — %${Math.round(p * 100)} risk, ~${min}dk beklenti.`;
  if (p >= 0.55)
    return `${f.flightNo} (${route}): Bağlantılı yolcuları izleyin, alternatif uçuş kapasitesini kontrol edin — ~${min}dk tahmini gecikme.`;
  if (p >= 0.4)
    return `${f.flightNo} (${route}): Orta risk — yer ekibini uyarın, ikram hazırlığı yapın (~${min}dk).`;
  return `${f.flightNo} (${route}): Düşük risk, normal operasyon izleyin.`;
}

function Gauge({ value = 75 }: { value?: number }) {
  const cx = 110;
  const cy = 110;
  const r = 78;
  const v = valueToRatio(value);
  const [nx, ny] = polar(cx, cy, r - 6, v);
  return (
    <svg viewBox="0 0 220 150" className="w-full">
      <defs>
        <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff5560" />
          <stop offset="100%" stopColor="#E30A17" />
        </linearGradient>
      </defs>
      <path d={arc(cx, cy, r, 0, 1)} stroke="rgba(255,255,255,0.13)" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={arc(cx, cy, r, 0, v)} stroke="url(#redGrad)" strokeWidth="14" fill="none" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#fff" />
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize="26" fontWeight="700" fill="#E30A17">
        {value}%
      </text>
    </svg>
  );
}

export default function RightPanel() {
  // ─── Merkezi canlı veri ──────────────────────────────────────
  const { kpi, riskItems, lastAlert, lastRefreshedAt, isLoading } = useLiveData();

  const [carouselIdx, setCarouselIdx] = useState(0);

  // Uçuş carousel — 4s'de bir bir sonraki yüksek-riskli uçuşa geç
  const carouselFlights = riskItems.filter((f) => (f.delayProbability ?? 0) >= 0.3);

  useEffect(() => {
    if (carouselFlights.length === 0) return;
    const t = setInterval(
      () => setCarouselIdx((i) => (i + 1) % carouselFlights.length),
      4000
    );
    return () => clearInterval(t);
  }, [carouselFlights.length]);

  const riskIndex = kpi?.riskIndex ?? 0;

  // Uçuş-spesifik öneriler: en riskli 4 uçuş
  const topRiskyFlights = riskItems
    .filter((f) => (f.delayProbability ?? 0) >= 0.35)
    .slice(0, 4);

  const liveLabel = `Canlı · WebSocket · ${lastRefreshedAt.toLocaleTimeString("tr-TR")}`;

  return (
    <aside className="w-full xl:w-[360px] h-auto xl:h-full p-5 flex flex-col gap-4 z-10 overflow-y-auto shrink-0">
      {/* Gauge */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Kriz Tahmincisi</h3>
        <div className="rounded-xl bg-black/30 p-4 border border-white/5">
          {isLoading && !kpi ? (
            <Skeleton className="h-[150px] w-full" />
          ) : !kpi ? (
            <ErrorState onRetry={() => {}} />
          ) : (
            <>
              <Gauge value={riskIndex} />
              <div className="text-center -mt-1 text-sm text-white/80 font-medium leading-tight">
                Aksaklık<br />Risk Endeksi
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-white/40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {liveLabel}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Proaktif AI uyarısı (son tespit) */}
      {lastAlert && (
        <div className="glass rounded-2xl p-4 border border-thy/40">
          <div className="text-[11px] text-thy font-semibold uppercase tracking-wider mb-2">
            ⚠ AI Proaktif Tespit
          </div>
          <div className="text-sm font-medium">
            {lastAlert.flightNo} — {lastAlert.route}
          </div>
          <div className="text-xs text-white/65 mt-1">
            Tahmini gecikme: ~{lastAlert.expectedDelayMin} dk · {lastAlert.affectedCount} yolcu
          </div>
          <div className="flex gap-3 mt-2 text-[11px]">
            {lastAlert.careActions.hotel > 0 && (
              <span className="text-cyan-400">🏨 {lastAlert.careActions.hotel} otel</span>
            )}
            {lastAlert.careActions.meal > 0 && (
              <span className="text-emerald-400">🍽 {lastAlert.careActions.meal} ikram</span>
            )}
            {lastAlert.careActions.refund > 0 && (
              <span className="text-orange-400">💳 {lastAlert.careActions.refund} iade</span>
            )}
          </div>
        </div>
      )}

      {/* Uçuş Risk Carousel — ML'den gerçek veriler, sırayla */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[15px]">Uçuş Risk Tahmini</h3>
          {carouselFlights.length > 0 && (
            <span className="text-[10px] text-white/40">
              {carouselIdx + 1} / {carouselFlights.length}
            </span>
          )}
        </div>
        {isLoading && riskItems.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : carouselFlights.length === 0 ? (
          <p className="text-[13px] text-emerald-400">Tüm hatlar normal — risk yok.</p>
        ) : (() => {
          const f = carouselFlights[carouselIdx % carouselFlights.length];
          const p = f.delayProbability ?? 0;
          const pct = Math.round(p * 100);
          const min = f.expectedDelayMin ?? 0;
          const lvl = bandLabel(p);
          return (
            <div key={f.flightNo} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[15px]">{f.flightNo}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  lvl === "Yüksek" ? "bg-thy/20 text-thy" :
                  lvl === "Orta"   ? "bg-orange-500/20 text-orange-400" :
                                     "bg-emerald-500/20 text-emerald-400"
                }`}>{lvl}</span>
              </div>
              <p className="text-xs text-white/55">{f.route}</p>
              {/* Olasılık çubuğu */}
              <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                  <span>Gecikme Olasılığı</span>
                  <span className={bandColor(p)}>{pct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      p >= 0.65 ? "bg-thy" : p >= 0.4 ? "bg-orange-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-[12px]">
                <span className="text-white/60">Tahmini gecikme</span>
                <span className={`font-medium ${bandColor(p)}`}>~{min} dk</span>
              </div>
              {/* Nokta göstergesi */}
              <div className="flex gap-1 justify-center pt-1">
                {carouselFlights.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === carouselIdx % carouselFlights.length
                        ? "bg-thy w-3"
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* AI Önerileri — uçuş-spesifik, gerçek ML verisinden */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Önerileri</h3>
        {isLoading && riskItems.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : topRiskyFlights.length > 0 ? (
          <div className="space-y-2.5">
            {topRiskyFlights.map((f) => {
              const p = f.delayProbability ?? 0;
              return (
                <div key={f.flightNo} className="flex gap-2 text-[12px] leading-relaxed">
                  <span className={`mt-0.5 shrink-0 ${bandColor(p)}`}>
                    {p >= 0.65 ? "⚠" : p >= 0.4 ? "▲" : "•"}
                  </span>
                  <p className="text-white/80">{flightSuggestion(f)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-emerald-400">Tüm uçuşlar normal seyirde.</p>
        )}
      </div>
    </aside>
  );
}

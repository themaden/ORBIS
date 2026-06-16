// RightPanel — Yapay Zeka Kriz Tahmincisi
// Tüm veriler backend'den: KPI risk skoru, ML gecikme tahminleri, proaktif ai_alert.
// Mock veri yok.
import { useEffect, useState } from "react";
import { getKpi, getFlightRisk } from "../api/irrops";
import type { KpiSummary, RiskFlightItem } from "../api/irrops";
import { getSocket } from "../api/socket";
import { useApi } from "../hooks/useApi";
import { Skeleton, ErrorState } from "./Skeleton";
import { polar, arcPath as arc, valueToRatio } from "../lib/gauge";
import type { Delay, DelayLevel } from "../types";

function riskToDelays(items: RiskFlightItem[]): Delay[] {
  const high = items.filter((f) => (f.delayProbability ?? 0) >= 0.6);
  const mid = items.filter(
    (f) => (f.delayProbability ?? 0) >= 0.35 && (f.delayProbability ?? 0) < 0.6
  );
  const result: Delay[] = [];
  if (high.length > 0) {
    const avgMin =
      high.reduce((s, f) => s + (f.expectedDelayMin ?? 0), 0) / high.length;
    result.push({
      region: `${high.length} yüksek riskli uçuş`,
      level: "Yüksek" as DelayLevel,
      extraHours: Math.round((avgMin / 60) * 10) / 10 || 1,
    });
  }
  if (mid.length > 0) {
    const avgMin =
      mid.reduce((s, f) => s + (f.expectedDelayMin ?? 0), 0) / mid.length;
    result.push({
      region: `${mid.length} orta riskli uçuş`,
      level: "Orta" as DelayLevel,
      extraHours: Math.round((avgMin / 60) * 10) / 10 || 0.5,
    });
  }
  if (result.length === 0) {
    result.push({ region: "Tüm hatlar normal", level: "Düşük" as DelayLevel, extraHours: 0 });
  }
  return result;
}

const levelColor = (lvl: DelayLevel) =>
  lvl === "Yüksek"
    ? "text-thy"
    : lvl === "Orta"
    ? "text-orange-400"
    : "text-emerald-400";

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

interface AiAlert {
  flightNo: string;
  route: string;
  expectedDelayMin: number;
  affectedCount: number;
  careActions: { hotel: number; meal: number; refund: number };
}

export default function RightPanel() {
  const kpi = useApi<KpiSummary>(() => getKpi());
  const risk = useApi(() => getFlightRisk());

  const [liveRisk, setLiveRisk] = useState<number | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [liveAt, setLiveAt] = useState<number | null>(null);
  const [lastAlert, setLastAlert] = useState<AiAlert | null>(null);

  useEffect(() => {
    const s = getSocket();

    const onKpi = (k: KpiSummary) => {
      setLiveRisk(k.riskIndex);
      if (k.riskSuggestions?.length) setLiveSuggestions(k.riskSuggestions);
      setLiveAt(Date.now());
    };

    const onAiAlert = (payload: AiAlert) => {
      setLastAlert(payload);
      // Risk listesini de tazele
      risk.reload();
      kpi.reload();
    };

    s.on("kpi", onKpi);
    s.on("ai_alert", onAiAlert);
    return () => {
      s.off("kpi", onKpi);
      s.off("ai_alert", onAiAlert);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const riskIndex = liveRisk ?? kpi.data?.riskIndex ?? 0;
  const suggestions =
    liveSuggestions.length > 0
      ? liveSuggestions
      : kpi.data?.riskSuggestions ?? [];

  const delays = risk.data ? riskToDelays(risk.data.items) : [];

  const liveLabel = liveAt
    ? `Canlı · WebSocket · ${new Date(liveAt).toLocaleTimeString("tr-TR")}`
    : "Canlı · WebSocket (AI)";

  const loading = kpi.loading || risk.loading;
  const error = kpi.error && risk.error;

  return (
    <aside className="w-full xl:w-[360px] h-auto xl:h-full p-5 flex flex-col gap-4 z-10 overflow-y-auto shrink-0">
      {/* Gauge */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Kriz Tahmincisi</h3>
        <div className="rounded-xl bg-black/30 p-4 border border-white/5">
          {loading && !kpi.data ? (
            <Skeleton className="h-[150px] w-full" />
          ) : error ? (
            <ErrorState onRetry={() => { kpi.reload(); risk.reload(); }} />
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

      {/* Tahmini Gecikmeler — ML'den gerçek veri */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Tahmini Gecikmeler</h3>
        {risk.loading && !risk.data ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <div className="space-y-1.5 text-[13.5px]">
            {delays.map((d) => (
              <div key={d.region}>
                {d.region} (
                <span className={levelColor(d.level)}>{d.level}</span>
                {d.extraHours > 0 && (
                  <>, <span className={levelColor(d.level)}>+{d.extraHours}sa</span></>
                )}
                )
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Önerileri — KPI'dan gerçek veri */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Önerileri</h3>
        {kpi.loading && !kpi.data ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3 text-[13px] text-white/85 leading-relaxed">
            {suggestions.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-white/50">AI önerisi üretiliyor…</p>
        )}
      </div>
    </aside>
  );
}

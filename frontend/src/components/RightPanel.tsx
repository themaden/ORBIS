import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getKpi } from "../api/irrops";
import type { KpiSummary } from "../api/irrops";
import { getSocket } from "../api/socket";
import { useApi } from "../hooks/useApi";
import { Skeleton, ErrorState } from "./Skeleton";
import { polar, arcPath as arc, valueToRatio } from "../lib/gauge";
import type { Crisis, DelayLevel } from "../types";

type CrisisView = Crisis & { source?: string };

// Önce backend KPI'sını dener; başarısızsa mock kriz verisine düşer
async function loadCrisis(): Promise<CrisisView> {
  const base = await api.getCrisis();
  try {
    const k = await getKpi();
    return {
      ...base,
      riskIndex: k.riskIndex,
      suggestions: k.riskSuggestions?.length ? k.riskSuggestions : base.suggestions,
      source: "backend",
    };
  } catch {
    return { ...base, source: "mock" };
  }
}

const levelColor = (lvl: DelayLevel) =>
  lvl === "Yüksek" ? "text-thy" : lvl === "Orta" ? "text-orange-400" : "text-emerald-400";

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

      {/* track */}
      <path
        d={arc(cx, cy, r, 0, 1)}
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      {/* value */}
      <path
        d={arc(cx, cy, r, 0, v)}
        stroke="url(#redGrad)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      {/* needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#fff" />
      {/* value text */}
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize="26" fontWeight="700" fill="#E30A17">
        {value}%
      </text>
    </svg>
  );
}

export default function RightPanel() {
  const { data, loading, error, reload } = useApi<CrisisView>(loadCrisis);
  const [live, setLive] = useState<Crisis | null>(null);

  // Backend bağlıysa WebSocket'ten canlı KPI; değilse mock animasyon
  useEffect(() => {
    if (!data) return;
    if (data.source === "backend") {
      const s = getSocket();
      const onKpi = (k: KpiSummary) =>
        setLive({
          riskIndex: k.riskIndex,
          delays: data.delays,
          suggestions: k.riskSuggestions?.length ? k.riskSuggestions : data.suggestions,
          updatedAt: Date.now(),
        });
      s.on("kpi", onKpi);
      return () => {
        s.off("kpi", onKpi);
      };
    }
    const unsub = api.subscribeCrisis(setLive);
    return unsub;
  }, [data]);

  const view = live || data;
  const updatedAt = live?.updatedAt;
  const liveLabel =
    data?.source === "backend"
      ? updatedAt
        ? `Canlı · WebSocket · ${new Date(updatedAt).toLocaleTimeString("tr-TR")}`
        : "Canlı · WebSocket (AI)"
      : updatedAt
      ? `Canlı · ${new Date(updatedAt).toLocaleTimeString("tr-TR")}`
      : "Canlı veri akışı";

  return (
    <aside className="w-full xl:w-[360px] h-auto xl:h-full p-5 flex flex-col gap-4 z-10 overflow-y-auto shrink-0">
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Kriz Tahmincisi</h3>
        <div className="rounded-xl bg-black/30 p-4 border border-white/5">
          {loading || !view ? (
            <Skeleton className="h-[150px] w-full" />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : (
            <>
              <Gauge value={view.riskIndex} />
              <div className="text-center -mt-1 text-sm text-white/80 font-medium leading-tight">
                Aksaklık
                <br />
                Risk Endeksi
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-white/40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                {liveLabel}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Tahmini Gecikmeler</h3>
        {loading || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="space-y-1.5 text-[13.5px]">
            {data.delays.map((d) => (
              <div key={d.region}>
                {d.region} (
                <span className={levelColor(d.level)}>{d.level}</span>,{" "}
                <span className={levelColor(d.level)}>+{d.extraHours}sa</span>)
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Önerileri</h3>
        {loading || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="space-y-3 text-[13px] text-white/85 leading-relaxed">
            {data.suggestions.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

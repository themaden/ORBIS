import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { Skeleton, ErrorState } from "./Skeleton";
import { polar, arcPath as arc, valueToRatio } from "../lib/gauge";

const levelColor = (lvl) =>
  lvl === "Yüksek" ? "text-thy" : lvl === "Orta" ? "text-orange-400" : "text-emerald-400";

function Gauge({ value = 75 }) {
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
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="#fff" />
      {/* value text */}
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill="#E30A17"
      >
        {value}%
      </text>
    </svg>
  );
}

export default function RightPanel() {
  const { data, loading, error, reload } = useApi(() => api.getCrisis());

  return (
    <aside className="w-[360px] h-full p-5 flex flex-col gap-4 z-10 overflow-y-auto">
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">
          Yapay Zeka Kriz Tahmincisi
        </h3>
        <div className="rounded-xl bg-black/30 p-4 border border-white/5">
          {loading ? (
            <Skeleton className="h-[150px] w-full" />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : (
            <>
              <Gauge value={data.riskIndex} />
              <div className="text-center -mt-1 text-sm text-white/80 font-medium leading-tight">
                Aksaklık
                <br />
                Risk Endeksi
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Tahmini Gecikmeler</h3>
        {loading ? (
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
        {loading ? (
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

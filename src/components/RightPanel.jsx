function polar(cx, cy, r, t) {
  // t: 0 = left (180°), 1 = right (0°), arc over the top
  const a = Math.PI - t * Math.PI;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

function arc(cx, cy, r, t0, t1) {
  const [x1, y1] = polar(cx, cy, r, t0);
  const [x2, y2] = polar(cx, cy, r, t1);
  const large = t1 - t0 > 0.5 ? 1 : 0;
  // sweep = 1 draws clockwise (over the top) for our orientation
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function Gauge({ value = 75 }) {
  const cx = 110;
  const cy = 110;
  const r = 78;
  const v = value / 100;

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
  return (
    <aside className="w-[360px] h-full p-5 flex flex-col gap-4 z-10 overflow-y-auto">
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">
          Yapay Zeka Kriz Tahmincisi
        </h3>
        <div className="rounded-xl bg-black/30 p-4 border border-white/5">
          <Gauge value={75} />
          <div className="text-center -mt-1 text-sm text-white/80 font-medium leading-tight">
            Aksaklık
            <br />
            Risk Endeksi
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Tahmini Gecikmeler</h3>
        <div className="space-y-1.5 text-[13.5px]">
          <div>
            Europe (<span className="text-thy">Major</span>,{" "}
            <span className="text-thy">+2.5h</span>)
          </div>
          <div>
            Asia (<span className="text-orange-400">Moderate</span>,{" "}
            <span className="text-orange-400">+1h</span>)
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-[15px] mb-3">Yapay Zeka Önerileri</h3>
        <div className="space-y-3 text-[13px] text-white/85 leading-relaxed">
          <p>Pre-allocate 50 hotel rooms in London due to incoming storm</p>
          <p>Reroute flights over central Europe to avoid weather system.</p>
        </div>
      </div>
    </aside>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
} from "d3-geo";
import { feature } from "topojson-client";

const SIZE = 560;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 18;

const IST = [28.97, 41.01];

const destinations = [
  [-74.0, 40.7], [-87.6, 41.9], [-95.4, 29.8], [-118.2, 34.0],
  [-79.4, 43.7], [-99.1, 19.4], [-58.4, -34.6], [-46.6, -23.5],
  [-70.6, -33.4], [-77.0, -12.0], [-0.12, 51.5], [2.35, 48.85],
  [13.4, 52.5], [12.5, 41.9], [-3.7, 40.4], [4.9, 52.4],
  [37.6, 55.7], [30.5, 50.4], [23.7, 38.0], [31.2, 30.0],
  [3.4, 6.5], [18.4, -33.9], [36.8, -1.3], [55.3, 25.2],
  [46.7, 24.7], [51.4, 35.7], [77.2, 28.6], [72.9, 19.1],
  [116.4, 39.9], [121.5, 31.2], [139.7, 35.7], [126.9, 37.6],
  [103.8, 1.35], [100.5, 13.7], [106.8, -6.2], [151.2, -33.9],
  [174.8, -36.8],
];

export default function WorldMap() {
  const [land, setLand] = useState([]);
  const [lambda, setLambda] = useState(20);
  const dragging = useRef(false);
  const last = useRef(0);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => setLand(feature(topo, topo.objects.countries).features))
      .catch(() => {});
  }, []);

  // auto-rotate
  useEffect(() => {
    let raf;
    let prev = performance.now();
    const tick = (now) => {
      const dt = now - prev;
      prev = now;
      if (!dragging.current) {
        setLambda((l) => (l + dt * 0.006) % 360);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rotate = [-lambda, -18, 0];
  const center = [lambda, 18]; // point facing the viewer (for visibility test)

  const projection = geoOrthographic()
    .scale(R)
    .translate([CX, CY])
    .rotate(rotate)
    .clipAngle(90);
  const path = geoPath(projection).pointRadius(2.4);

  const visible = (c) => geoDistance(c, center) < Math.PI / 2 - 0.02;

  const routeFeatures = destinations
    .filter((d) => visible(d) || visible(IST))
    .map((d) => ({ type: "LineString", coordinates: [IST, d] }));

  const istPt = projection(IST);
  const istVisible = visible(IST);

  // drag to spin
  const onDown = (e) => {
    dragging.current = true;
    last.current = e.clientX;
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current;
    last.current = e.clientX;
    setLambda((l) => (l + dx * 0.4 + 360) % 360);
  };
  const onUp = () => (dragging.current = false);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full max-h-full select-none cursor-grab active:cursor-grabbing"
        style={{ width: "auto" }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      >
        <defs>
          <radialGradient id="ocean" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#1c2230" />
            <stop offset="70%" stopColor="#11151e" />
            <stop offset="100%" stopColor="#080a10" />
          </radialGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="#E30A17" stopOpacity="0" />
            <stop offset="100%" stopColor="#E30A17" stopOpacity="0.35" />
          </radialGradient>
          <radialGradient id="istGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E30A17" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E30A17" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* atmosphere glow */}
        <circle cx={CX} cy={CY} r={R + 12} fill="url(#glow)" />

        {/* ocean sphere */}
        <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" />

        {/* graticule */}
        <path
          d={path(geoGraticule10())}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {/* land */}
        {land.map((g, i) => (
          <path
            key={i}
            d={path(g)}
            fill="#3a4150"
            stroke="#4a5260"
            strokeWidth="0.4"
          />
        ))}

        {/* flight routes (great circles, auto-clipped to near side) */}
        {routeFeatures.map((f, i) => (
          <path
            key={`r-${i}`}
            d={path(f)}
            fill="none"
            stroke="#E30A17"
            strokeWidth="1"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        ))}

        {/* destination markers */}
        {destinations.map((d, i) => {
          if (!visible(d)) return null;
          const p = projection(d);
          if (!p) return null;
          return (
            <g key={`m-${i}`}>
              <circle cx={p[0]} cy={p[1]} r="4.5" fill="#E30A17" opacity="0.2" />
              <circle cx={p[0]} cy={p[1]} r="2.2" fill="#ff4d57" />
            </g>
          );
        })}

        {/* Istanbul hub */}
        {istVisible && istPt && (
          <g>
            <circle cx={istPt[0]} cy={istPt[1]} r="30" fill="url(#istGlow)" />
            <circle
              cx={istPt[0]}
              cy={istPt[1]}
              r="15"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1"
            />
            <text
              x={istPt[0]}
              y={istPt[1] - 24}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#fff"
            >
              İstanbul
            </text>
            <text
              x={istPt[0]}
              y={istPt[1] + 30}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.7)"
            >
              (IST)
            </text>
          </g>
        )}

        {/* rim */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

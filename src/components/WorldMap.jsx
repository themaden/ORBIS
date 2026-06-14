import { useEffect, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { Plane } from "lucide-react";

const WIDTH = 1000;
const HEIGHT = 520;

const projection = geoEqualEarth()
  .scale(185)
  .translate([WIDTH / 2, HEIGHT / 2 + 10]);

const pathGen = geoPath(projection);

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

function arcPath(from, to) {
  const [x1, y1] = projection(from);
  const [x2, y2] = projection(to);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dr = Math.sqrt(dx * dx + dy * dy) * 1.4;
  return `M ${x1} ${y1} A ${dr} ${dr} 0 0 1 ${x2} ${y2}`;
}

export default function WorldMap() {
  const [geos, setGeos] = useState([]);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        const fc = feature(topo, topo.objects.countries);
        setGeos(fc.features);
      })
      .catch(() => {});
  }, []);

  const [istX, istY] = projection(IST);

  return (
    <div className="absolute inset-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        {/* grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <radialGradient id="istGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#E30A17" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E30A17" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />

        {/* countries */}
        {geos.map((g, i) => (
          <path
            key={i}
            d={pathGen(g)}
            fill="#2b2f38"
            stroke="#3c424d"
            strokeWidth="0.4"
          />
        ))}

        {/* flight routes */}
        {destinations.map((d, i) => (
          <path
            key={`r-${i}`}
            d={arcPath(IST, d)}
            fill="none"
            stroke="#E30A17"
            strokeWidth="0.9"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />
        ))}

        {/* destination markers */}
        {destinations.map((d, i) => {
          const [x, y] = projection(d);
          return (
            <g key={`m-${i}`}>
              <circle cx={x} cy={y} r="4.5" fill="#E30A17" opacity="0.18" />
              <circle cx={x} cy={y} r="2.2" fill="#E30A17" />
            </g>
          );
        })}

        {/* Istanbul hub */}
        <circle cx={istX} cy={istY} r="38" fill="url(#istGlow)" />
        <circle
          cx={istX}
          cy={istY}
          r="18"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
        />
        <foreignObject x={istX - 9} y={istY - 9} width="18" height="18">
          <div style={{ color: "#fff" }}>
            <Plane size={18} />
          </div>
        </foreignObject>
        <text
          x={istX}
          y={istY - 28}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#fff"
        >
          İstanbul
        </text>
        <text
          x={istX}
          y={istY + 38}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(255,255,255,0.7)"
        >
          (IST)
        </text>
      </svg>
    </div>
  );
}

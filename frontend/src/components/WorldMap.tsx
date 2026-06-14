import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
  type GeoPermissibleObjects,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";

const SIZE = 560;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 18;

type Coord = [number, number];
type Capital = [number, number, string];
type Plane = [number, number, number];

const IST: Coord = [28.97, 41.01];

// All country capitals: [lon, lat, name]
const capitals = [
  [32.85, 39.93, "Ankara"], [13.40, 52.52, "Berlin"], [2.35, 48.85, "Paris"],
  [-0.13, 51.51, "Londra"], [-3.70, 40.42, "Madrid"], [12.50, 41.90, "Roma"],
  [-9.14, 38.72, "Lizbon"], [-6.26, 53.35, "Dublin"], [4.90, 52.37, "Amsterdam"],
  [4.35, 50.85, "Brüksel"], [7.45, 46.95, "Bern"], [16.37, 48.21, "Viyana"],
  [14.42, 50.09, "Prag"], [21.01, 52.23, "Varşova"], [19.04, 47.50, "Budapeşte"],
  [26.10, 44.43, "Bükreş"], [23.32, 42.70, "Sofya"], [23.73, 37.98, "Atina"],
  [20.46, 44.82, "Belgrad"], [15.98, 45.81, "Zagreb"], [18.41, 43.85, "Saraybosna"],
  [21.43, 42.00, "Üsküp"], [19.82, 41.33, "Tiran"], [19.26, 42.44, "Podgorica"],
  [21.17, 42.67, "Priştine"], [14.51, 46.06, "Ljubljana"], [17.11, 48.15, "Bratislava"],
  [30.52, 50.45, "Kiev"], [27.57, 53.90, "Minsk"], [37.62, 55.75, "Moskova"],
  [28.86, 47.01, "Kişinev"], [25.28, 54.69, "Vilnius"], [24.11, 56.95, "Riga"],
  [24.75, 59.44, "Tallinn"], [24.94, 60.17, "Helsinki"], [18.07, 59.33, "Stockholm"],
  [10.75, 59.91, "Oslo"], [12.57, 55.68, "Kopenhag"], [-21.94, 64.15, "Reykjavik"],
  [6.13, 49.61, "Lüksemburg"], [14.51, 35.90, "Valletta"], [33.36, 35.17, "Lefkoşa"],
  [51.39, 35.69, "Tahran"], [44.36, 33.31, "Bağdat"], [46.72, 24.69, "Riyad"],
  [44.21, 15.35, "Sana"], [58.41, 23.59, "Maskat"], [54.37, 24.45, "Abu Dabi"],
  [51.53, 25.29, "Doha"], [50.58, 26.23, "Manama"], [47.98, 29.38, "Kuveyt"],
  [35.93, 31.95, "Amman"], [36.29, 33.51, "Şam"], [35.50, 33.89, "Beyrut"],
  [35.21, 31.77, "Kudüs"], [44.83, 41.72, "Tiflis"], [44.51, 40.18, "Erivan"],
  [49.87, 40.41, "Bakü"], [71.43, 51.13, "Astana"], [69.24, 41.30, "Taşkent"],
  [58.38, 37.95, "Aşkabat"], [68.78, 38.54, "Duşanbe"], [74.59, 42.87, "Bişkek"],
  [69.18, 34.53, "Kabil"], [73.06, 33.69, "İslamabad"], [77.21, 28.61, "Yeni Delhi"],
  [85.32, 27.71, "Katmandu"], [89.64, 27.47, "Timphu"], [90.41, 23.81, "Dakka"],
  [79.86, 6.93, "Kolombo"], [73.51, 4.18, "Male"], [96.13, 19.76, "Naypyidaw"],
  [100.50, 13.75, "Bangkok"], [102.60, 17.97, "Vientiane"], [104.92, 11.56, "Phnom Penh"],
  [105.83, 21.03, "Hanoi"], [101.69, 3.14, "Kuala Lumpur"], [103.82, 1.35, "Singapur"],
  [106.85, -6.21, "Cakarta"], [120.98, 14.60, "Manila"], [116.40, 39.90, "Pekin"],
  [106.92, 47.92, "Ulanbator"], [125.76, 39.04, "Pyongyang"], [126.98, 37.57, "Seul"],
  [139.69, 35.69, "Tokyo"], [121.56, 25.03, "Taipei"], [31.24, 30.04, "Kahire"],
  [13.19, 32.89, "Trablus"], [10.18, 36.81, "Tunus"], [3.06, 36.75, "Cezayir"],
  [-6.84, 34.02, "Rabat"], [-15.98, 18.08, "Nuakşot"], [-17.45, 14.69, "Dakar"],
  [-8.00, 12.65, "Bamako"], [2.11, 13.51, "Niamey"], [15.04, 12.11, "Encemine"],
  [32.53, 15.50, "Hartum"], [38.93, 15.32, "Asmara"], [38.74, 9.03, "Addis Ababa"],
  [43.15, 11.59, "Cibuti"], [45.34, 2.04, "Mogadişu"], [36.82, -1.29, "Nairobi"],
  [32.58, 0.35, "Kampala"], [30.06, -1.94, "Kigali"], [29.36, -3.38, "Bujumbura"],
  [35.74, -6.16, "Dodoma"], [28.32, -15.39, "Lusaka"], [31.05, -17.83, "Harare"],
  [33.79, -13.96, "Lilongwe"], [32.59, -25.97, "Maputo"], [47.52, -18.88, "Antananarivo"],
  [25.92, -24.65, "Gaborone"], [17.08, -22.56, "Windhoek"], [28.19, -25.75, "Pretoria"],
  [27.48, -29.31, "Maseru"], [31.13, -26.32, "Mbabane"], [13.23, -8.84, "Luanda"],
  [15.27, -4.44, "Kinşasa"], [15.28, -4.27, "Brazzavil"], [9.45, 0.39, "Librevil"],
  [11.52, 3.85, "Yaounde"], [18.56, 4.39, "Bangui"], [8.78, 3.75, "Malabo"],
  [7.49, 9.06, "Abuja"], [2.63, 6.50, "Porto-Novo"], [1.22, 6.13, "Lome"],
  [-0.19, 5.60, "Akra"], [-1.53, 12.37, "Vagadugu"], [-5.27, 6.82, "Yamusukro"],
  [-10.80, 6.30, "Monrovia"], [-13.23, 8.48, "Freetown"], [-13.71, 9.64, "Konakri"],
  [-15.18, 11.86, "Bissau"], [-16.58, 13.45, "Banjul"], [-23.51, 14.93, "Praia"],
  [-77.04, 38.91, "Washington"], [-75.70, 45.42, "Ottawa"], [-99.13, 19.43, "Meksiko"],
  [-90.51, 14.63, "Guatemala"], [-89.19, 13.69, "San Salvador"], [-87.21, 14.07, "Tegucigalpa"],
  [-86.25, 12.11, "Managua"], [-84.09, 9.93, "San Jose"], [-79.52, 8.98, "Panama"],
  [-82.38, 23.11, "Havana"], [-77.34, 25.06, "Nassau"], [-76.79, 18.01, "Kingston"],
  [-72.34, 18.55, "Port-au-Prince"], [-69.93, 18.49, "Santo Domingo"], [-74.07, 4.71, "Bogota"],
  [-66.90, 10.49, "Karakas"], [-78.47, -0.18, "Quito"], [-77.04, -12.05, "Lima"],
  [-68.15, -16.50, "La Paz"], [-47.93, -15.78, "Brasilia"], [-57.58, -25.30, "Asuncion"],
  [-56.16, -34.90, "Montevideo"], [-58.38, -34.60, "Buenos Aires"], [-70.65, -33.46, "Santiago"],
  [-58.16, 6.80, "Georgetown"], [-55.20, 5.87, "Paramaribo"], [149.13, -35.28, "Canberra"],
  [174.78, -41.29, "Wellington"], [147.18, -9.44, "Port Moresby"], [178.44, -18.12, "Suva"],
  [-171.76, -13.83, "Apia"], [10.45, 51.17, "Frankfurt"], [-21.83, 64.13, "Keflavik"],
] as unknown as Capital[];

// Pseudo-random flightradar-style planes derived from capitals (stable)
function makePlanes(): Plane[] {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const planes: Plane[] = [];
  for (let i = 0; i < 55; i++) {
    const base = capitals[Math.floor(rnd() * capitals.length)];
    planes.push([
      base[0] + (rnd() - 0.5) * 18,
      base[1] + (rnd() - 0.5) * 14,
      Math.floor(rnd() * 360), // heading
    ]);
  }
  return planes;
}

const PLANE =
  "M0,-9 L1.4,-3 L8,1 L8,2.6 L1.4,1.6 L1,7 L3,8.6 L3,9.6 L0,8.6 L-3,9.6 L-3,8.6 L-1,7 L-1.4,1.6 L-8,2.6 L-8,1 L-1.4,-3 Z";

type Status = "loading" | "ready" | "error";

export default function WorldMap() {
  const [land, setLand] = useState<Feature[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [lambda, setLambda] = useState(20);
  const dragging = useRef(false);
  const last = useRef(0);
  const planes = useMemo(() => makePlanes(), []);

  useEffect(() => {
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => {
        if (!r.ok) throw new Error("network");
        return r.json();
      })
      .then((topo) => {
        if (cancelled) return;
        const fc = feature(
          topo,
          topo.objects.countries
        ) as unknown as FeatureCollection;
        setLand(fc.features);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = now - prev;
      prev = now;
      if (!dragging.current) setLambda((l) => (l + dt * 0.005) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rotate: [number, number, number] = [-lambda, -18, 0];
  const center: Coord = [lambda, 18];

  const projection = geoOrthographic()
    .scale(R)
    .translate([CX, CY])
    .rotate(rotate)
    .clipAngle(90);
  const path = geoPath(projection).pointRadius(2.4);

  const visible = (c: Coord) => geoDistance(c, center) < Math.PI / 2 - 0.02;
  const draw = (obj: GeoPermissibleObjects) => path(obj) ?? undefined;

  // a handful of red routes from IST to major hubs
  const majorRoutes = (
    [
      [-74, 40.7], [-0.13, 51.5], [139.69, 35.69], [55.3, 25.2],
      [103.82, 1.35], [116.4, 39.9], [-43.2, -22.9], [37.62, 55.75],
      [31.24, 30.04], [77.21, 28.61], [-99.13, 19.43], [151.2, -33.9],
    ] as Coord[]
  )
    .filter((d) => visible(d) || visible(IST))
    .map(
      (d) =>
        ({ type: "LineString", coordinates: [IST, d] }) as GeoPermissibleObjects
    );

  const istPt = projection(IST);
  const istVisible = visible(IST);

  const onDown = (e: MouseEvent<SVGSVGElement>) => {
    dragging.current = true;
    last.current = e.clientX;
  };
  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current;
    last.current = e.clientX;
    setLambda((l) => (l + dx * 0.4 + 360) % 360);
  };
  const onUp = () => {
    dragging.current = false;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {status !== "ready" && (
        <div className="absolute z-10 flex flex-col items-center gap-3 text-center">
          {status === "loading" ? (
            <>
              <div className="w-10 h-10 border-2 border-white/15 border-t-thy rounded-full animate-spin" />
              <div className="text-sm text-white/60">Dünya haritası yükleniyor…</div>
            </>
          ) : (
            <>
              <div className="text-thy text-3xl">⚠</div>
              <div className="text-sm text-white/70">
                Harita verisi yüklenemedi.
                <br />
                İnternet bağlantısını kontrol edin.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-1 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
              >
                Tekrar dene
              </button>
            </>
          )}
        </div>
      )}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full max-h-full select-none cursor-grab active:cursor-grabbing"
        style={{ width: "auto", opacity: status === "ready" ? 1 : 0.25 }}
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

        <circle cx={CX} cy={CY} r={R + 12} fill="url(#glow)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" />

        <path
          d={draw(geoGraticule10())}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {land.map((g, i) => (
          <path
            key={i}
            d={draw(g)}
            fill="#3a4150"
            stroke="#4a5260"
            strokeWidth="0.4"
          />
        ))}

        {/* major flight routes */}
        {majorRoutes.map((f, i) => (
          <path
            key={`r-${i}`}
            d={draw(f)}
            fill="none"
            stroke="#E30A17"
            strokeWidth="1"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />
        ))}

        {/* capital markers (pins) */}
        {capitals.map((c, i) => {
          const coord: Coord = [c[0], c[1]];
          if (!visible(coord)) return null;
          const p = projection(coord);
          if (!p) return null;
          return (
            <g key={`c-${i}`}>
              <title>{c[2]}</title>
              <circle cx={p[0]} cy={p[1]} r="3.4" fill="#38bdf8" opacity="0.18" />
              <circle
                cx={p[0]}
                cy={p[1]}
                r="1.7"
                fill="#7dd3fc"
                stroke="#0b1220"
                strokeWidth="0.4"
              />
            </g>
          );
        })}

        {/* flightradar-style planes */}
        {planes.map((pl, i) => {
          const coord: Coord = [pl[0], pl[1]];
          if (!visible(coord)) return null;
          const p = projection(coord);
          if (!p) return null;
          return (
            <g
              key={`p-${i}`}
              transform={`translate(${p[0]},${p[1]}) rotate(${pl[2]}) scale(0.8)`}
            >
              <path d={PLANE} fill="#f5c518" stroke="#3a2c00" strokeWidth="0.6" />
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
              r="13"
              fill="rgba(227,10,23,0.18)"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1"
            />
            <g transform={`translate(${istPt[0]},${istPt[1]}) rotate(45) scale(0.95)`}>
              <path d={PLANE} fill="#fff" />
            </g>
            <text
              x={istPt[0]}
              y={istPt[1] - 22}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#fff"
            >
              İstanbul
            </text>
            <text
              x={istPt[0]}
              y={istPt[1] + 28}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.75)"
            >
              (IST)
            </text>
          </g>
        )}

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

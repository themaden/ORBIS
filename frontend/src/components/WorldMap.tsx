import { useEffect, useRef, useState } from "react";
import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Feature } from "geojson";
import { useLiveData } from "../context/useLiveData";

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 20;

type Coord = [number, number];
const IST: Coord = [28.97, 41.01];

// [lon, lat, ad]
const capitals: [number, number, string][] = [
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
];

const majorRoutes: Coord[] = [
  [-74, 40.7], [-0.13, 51.5], [139.69, 35.69], [55.3, 25.2],
  [103.82, 1.35], [116.4, 39.9], [-43.2, -22.9], [37.62, 55.75],
  [31.24, 30.04], [77.21, 28.61], [-99.13, 19.43], [151.2, -33.9],
];

// Pseudo-random flightradar-style planes (stable)
function makePlanes(): [number, number, number][] {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: [number, number, number][] = [];
  for (let i = 0; i < 55; i++) {
    const base = capitals[Math.floor(rnd() * capitals.length)];
    out.push([base[0] + (rnd() - 0.5) * 18, base[1] + (rnd() - 0.5) * 14, Math.floor(rnd() * 360)]);
  }
  return out;
}

const PLANE_PATH = new Path2D(
  "M0,-9 L1.4,-3 L8,1 L8,2.6 L1.4,1.6 L1,7 L3,8.6 L3,9.6 L0,8.6 L-3,9.6 L-3,8.6 L-1,7 L-1.4,1.6 L-8,2.6 L-8,1 L-1.4,-3 Z"
);

const planes = makePlanes();

export default function WorldMap() {
  const { riskItems } = useLiveData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landRef = useRef<Feature[]>([]);
  const lambdaRef = useRef(20);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const drawRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const highRiskCountRef = useRef(0);

  useEffect(() => {
    highRiskCountRef.current = riskItems.filter((r) => (r.delayProbability ?? 0) >= 0.6).length;
  }, [riskItems]);

  // Harita verisi
  useEffect(() => {
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => {
        if (!r.ok) throw new Error("network");
        return r.json();
      })
       
      .then((topo: any) => {
        if (cancelled) return;
        const fc = feature(topo, topo.objects.countries) as unknown as {
          features: Feature[];
        };
        landRef.current = fc.features;
        setStatus("ready");
        drawRef.current(); // rAF kısıtlıysa bile kıtaları hemen çiz
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Canvas çizim döngüsü (imperatif — React reconciliation yok)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 1.4;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let prev = performance.now();

    const draw = () => {
      const lambda = lambdaRef.current;
      const projection = geoOrthographic()
        .scale(R)
        .translate([CX, CY])
        .rotate([-lambda, -18, 0])
        .clipAngle(90);
       
      const path = geoPath(projection, ctx as any);
      const center: Coord = [lambda, 18];
      const visible = (c: Coord) => geoDistance(c, center) < Math.PI / 2 - 0.02;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // atmosfer parıltısı
      const glow = ctx.createRadialGradient(CX, CY, R - 4, CX, CY, R + 14);
      glow.addColorStop(0, "rgba(227,10,23,0)");
      glow.addColorStop(1, "rgba(227,10,23,0.32)");
      ctx.beginPath();
      ctx.arc(CX, CY, R + 14, 0, 2 * Math.PI);
      ctx.fillStyle = glow;
      ctx.fill();

      // okyanus küresi
      const ocean = ctx.createRadialGradient(CX * 0.84, CY * 0.76, 0, CX, CY, R);
      ocean.addColorStop(0, "#1c2230");
      ocean.addColorStop(0.7, "#11151e");
      ocean.addColorStop(1, "#080a10");
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, 2 * Math.PI);
      ctx.fillStyle = ocean;
      ctx.fill();

      // enlem/boylam çizgileri
      ctx.beginPath();
       
      path(geoGraticule10() as any);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // kıtalar
      const land = landRef.current;
      for (let i = 0; i < land.length; i++) {
        ctx.beginPath();
         
        path(land[i] as any);
        ctx.fillStyle = "#3a4150";
        ctx.fill();
        ctx.strokeStyle = "#4a5260";
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }

      // ana rotalar
      ctx.strokeStyle = "rgba(227,10,23,0.55)";
      ctx.lineWidth = 1;
      for (const d of majorRoutes) {
        if (!visible(d) && !visible(IST)) continue;
        ctx.beginPath();
         
        path({ type: "LineString", coordinates: [IST, d] } as any);
        ctx.stroke();
      }

      // başkent pinleri
      for (const c of capitals) {
        const coord: Coord = [c[0], c[1]];
        if (!visible(coord)) continue;
        const p = projection(coord);
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(56,189,248,0.18)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.7, 0, 2 * Math.PI);
        ctx.fillStyle = "#7dd3fc";
        ctx.fill();
      }

      // uçaklar
      let planeIdx = 0;
      const highRisk = highRiskCountRef.current;
      for (const pl of planes) {
        const isHighRiskPlane = planeIdx < highRisk;
        planeIdx++;

        const coord: Coord = [pl[0], pl[1]];
        if (!visible(coord)) continue;
        const p = projection(coord);
        if (!p) continue;
        
        // Kırmızı parlama efekti
        if (isHighRiskPlane) {
          ctx.beginPath();
          ctx.arc(p[0], p[1], 8, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(227,10,23,0.3)";
          ctx.fill();
        }

        ctx.save();
        ctx.translate(p[0], p[1]);
        ctx.rotate((pl[2] * Math.PI) / 180);
        ctx.scale(0.8, 0.8);
        ctx.fillStyle = isHighRiskPlane ? "#ff5560" : "#f5c518";
        ctx.fill(PLANE_PATH);
        ctx.restore();
      }

      // İstanbul hub
      if (visible(IST)) {
        const p = projection(IST);
        if (p) {
          const hub = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 30);
          hub.addColorStop(0, "rgba(227,10,23,0.6)");
          hub.addColorStop(1, "rgba(227,10,23,0)");
          ctx.beginPath();
          ctx.arc(p[0], p[1], 30, 0, 2 * Math.PI);
          ctx.fillStyle = hub;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p[0], p[1], 13, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(227,10,23,0.18)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.save();
          ctx.translate(p[0], p[1]);
          ctx.rotate((45 * Math.PI) / 180);
          ctx.scale(0.95, 0.95);
          ctx.fillStyle = "#fff";
          ctx.fill(PLANE_PATH);
          ctx.restore();
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.font = "600 11px Inter, sans-serif";
          ctx.fillText("İstanbul", p[0], p[1] - 22);
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.font = "10px Inter, sans-serif";
          ctx.fillText("(IST)", p[0], p[1] + 30);
        }
      }

      // çerçeve
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const render = (now: number) => {
      const dt = now - prev;
      prev = now;
      if (!draggingRef.current) lambdaRef.current = (lambdaRef.current + dt * 0.005) % 360;
      draw();
      raf = requestAnimationFrame(render);
    };

    drawRef.current = draw;
    draw(); // mount'ta ilk kareyi hemen çiz (rAF kısıtlı olsa bile görünür)
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
  };
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    lambdaRef.current = (lambdaRef.current + dx * 0.4 + 360) % 360;
  };
  const onUp = () => {
    draggingRef.current = false;
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
      <canvas
        ref={canvasRef}
        className="h-full max-h-full select-none cursor-grab active:cursor-grabbing"
        style={{ width: "auto", aspectRatio: "1 / 1", opacity: status === "ready" ? 1 : 0.25 }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plane, MapPin, Menu } from "lucide-react";

type ResultType = "Uçuş" | "Kaynak" | "Yolcu";
interface SearchItem {
  code: string;
  route: string;
  type: ResultType;
}

// type başına ilgili sayfa
const ROUTE_FOR: Record<ResultType, string> = {
  Uçuş: "/",
  Kaynak: "/kaynaklar",
  Yolcu: "/ayarlar",
};

const FLIGHTS: SearchItem[] = [
  { code: "TK1985", route: "IST → FRA", type: "Uçuş" },
  { code: "TK0011", route: "IST → JFK", type: "Uçuş" },
  { code: "TK0080", route: "IST → NRT", type: "Uçuş" },
  { code: "TK1822", route: "IST → LHR", type: "Uçuş" },
  { code: "TK0021", route: "IST → GRU", type: "Uçuş" },
  { code: "İstanbul (IST)", route: "Ana Üs", type: "Kaynak" },
  { code: "Frankfurt (FRA)", route: "Aktarma Noktası", type: "Kaynak" },
  { code: "Ahmet Yılmaz", route: "Operasyon Yöneticisi", type: "Yolcu" },
];

function liveClock() {
  return new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface TopBarProps {
  title: string;
  onMenu?: () => void;
}

export default function TopBar({ title, onMenu }: TopBarProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState(liveClock());
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const goToResult = (f: SearchItem) => {
    setQ(f.code);
    setOpen(false);
    navigate(ROUTE_FOR[f.type] || "/");
  };

  useEffect(() => {
    const id = setInterval(() => setClock(liveClock()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) =>
      boxRef.current &&
      !boxRef.current.contains(e.target as Node) &&
      setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return FLIGHTS.filter(
      (f) => f.code.toLowerCase().includes(t) || f.route.toLowerCase().includes(t)
    ).slice(0, 6);
  }, [q]);

  return (
    <div className="flex items-center justify-between px-4 md:px-8 pt-6 pb-4 gap-4 md:gap-6 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          aria-label="Menüyü aç"
          className="lg:hidden glass rounded-lg p-2 shrink-0"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl md:text-[32px] font-bold tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div ref={boxRef} className="relative">
          <div className="glass rounded-full px-4 py-2 flex items-center gap-3 w-[220px] md:w-[300px]">
            <Search size={16} className="text-white/60" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              aria-label="Uçuş, yolcu veya kaynak ara"
              placeholder="Uçuş, Yolcu veya Kaynak Ara"
              className="bg-transparent outline-none text-sm placeholder-white/50 flex-1 min-w-0"
            />
          </div>

          {open && q.trim() && (
            <div className="absolute top-full mt-2 w-full glass rounded-xl overflow-hidden z-50 shadow-xl">
              {results.length ? (
                results.map((f) => (
                  <button
                    key={f.code}
                    onClick={() => goToResult(f)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 text-left"
                  >
                    {f.type === "Kaynak" ? (
                      <MapPin size={15} className="text-thy shrink-0" />
                    ) : (
                      <Plane size={15} className="text-thy shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.code}</div>
                      <div className="text-[11px] text-white/50 truncate">
                        {f.route} · {f.type}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-white/50">
                  "{q}" için sonuç yok
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-thy opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-thy"></span>
          </span>
          <span className="text-sm font-medium">Canlı</span>
          <span className="text-xs text-white/50 tabular-nums hidden md:inline">
            {clock}
          </span>
        </div>
      </div>
    </div>
  );
}

// LiveFlights — Canlı Uçuş Tablosu
// Tüm veriler LiveDataContext'ten: uçuşlar + ML risk skorları.
// Kendi API/WebSocket çağrısı yok — merkezi haber bandı mantığı.
import { Plane, AlertTriangle } from "lucide-react";
import { useLiveData } from "../context/useLiveData";

const statusColor: Record<string, string> = {
  PLANNED: "text-cyan-400",
  BOARDING: "text-emerald-400",
  DELAYED: "text-orange-400",
  CANCELLED: "text-thy",
  DEPARTED: "text-white/60",
  ARRIVED: "text-white/40",
};

export default function LiveFlights() {
  // ─── Merkezi canlı veri ──────────────────────────────────────
  const { flights, riskMap, lastRefreshedAt, isLoading } = useLiveData();

  if (isLoading && flights.length === 0) {
    return (
      <div className="glass rounded-2xl p-4 text-xs text-white/55">
        Uçuşlar yükleniyor…
      </div>
    );
  }
  if (!isLoading && flights.length === 0) {
    return (
      <div className="glass rounded-2xl p-4 text-xs text-white/55">
        Backend kapalıyken canlı uçuş tablosu görünmez.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[14px]">Canlı Uçuş Tablosu</h3>
        <span className="text-[10px] text-white/45">
          {flights.length} uçuş · {lastRefreshedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead className="text-white/45 text-[10px] uppercase">
          <tr>
            <th className="text-left py-1">Uçuş</th>
            <th className="text-left">Rota</th>
            <th className="text-left">Durum</th>
            <th className="text-right">Risk</th>
          </tr>
        </thead>
        <tbody>
          {flights.slice(0, 14).map((f) => {
            const p = riskMap[f.id];
            const isHigh = p != null && p >= 0.7;
            return (
              <tr key={f.id} className="border-t border-white/5">
                <td className="py-1.5 font-medium flex items-center gap-1.5">
                  {isHigh && <AlertTriangle size={11} className="text-thy" />}
                  <Plane size={11} className="text-white/50" /> {f.flightNo}
                </td>
                <td className="text-white/70">
                  {f.depAirport.iata} → {f.arrAirport.iata}
                </td>
                <td className={statusColor[f.status] || "text-white/60"}>{f.status}</td>
                <td className="text-right">
                  {p != null ? (
                    <span className={isHigh ? "text-thy font-medium" : "text-white/60"}>
                      %{Math.round(p * 100)}
                    </span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

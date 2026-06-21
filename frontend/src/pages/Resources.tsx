import { useEffect, useRef } from "react";
import { Card, Stat } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import { useApi } from "../hooks/useApi";
import { Plane, Users, Hotel, Wrench, type LucideIcon } from "lucide-react";
import { getResourceFleet, getResourceStats, getResourceUsage } from "../api/irrops";
import { getSocket } from "../api/socket";

const ICONS: Record<string, LucideIcon> = { Plane, Users, Hotel, Wrench };

const statusColor = (s: string) =>
  s === "Uçuşta"   ? "text-emerald-400" :
  s === "Bakımda"  ? "text-orange-400"  :
  s === "Gecikmeli"? "text-thy"         :
  s === "Boarding" ? "text-cyan-400"    :
  s === "İndi"     ? "text-white/50"    : "text-white/70";

const loadColor = (pct: number) =>
  pct >= 90 ? "bg-thy" : pct >= 70 ? "bg-orange-500" : "bg-emerald-500";

export default function Resources() {
  const stats = useApi(() => getResourceStats());
  const fleet = useApi(() => getResourceFleet());
  const usage = useApi(() => getResourceUsage());

  const statsRef = useRef(stats.reload);
  const fleetRef = useRef(fleet.reload);
  const usageRef = useRef(usage.reload);
  useEffect(() => {
    statsRef.current = stats.reload;
    fleetRef.current = fleet.reload;
    usageRef.current = usage.reload;
  });

  useEffect(() => {
    const s = getSocket();
    const refresh = () => { statsRef.current(); fleetRef.current(); usageRef.current(); };
    s.on("disruption", refresh);
    s.on("apply", refresh);
    s.on("risk_update", refresh);
    const timer = setInterval(refresh, 30_000);
    return () => {
      s.off("disruption", refresh);
      s.off("apply", refresh);
      s.off("risk_update", refresh);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.loading || !stats.data
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          : stats.error
          ? <ErrorState onRetry={stats.reload} />
          : stats.data.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Filo Durumu" className="lg:col-span-2 overflow-x-auto">
          {fleet.loading || !fleet.data ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : fleet.error ? (
            <ErrorState onRetry={fleet.reload} />
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-white/50 text-left text-xs uppercase">
                <tr>
                  <th className="py-2">Sefer No</th>
                  <th>Model</th>
                  <th>Durum</th>
                  <th>Rota</th>
                  <th>Kalkış</th>
                  <th className="w-32">Doluluk</th>
                </tr>
              </thead>
              <tbody>
                {fleet.data.map((f) => {
                  const dep = f.scheduledDep
                    ? new Date(f.scheduledDep).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                    : "—";
                  const pct = f.loadPct ?? f.progress ?? 0;
                  return (
                    <tr key={f.code} className="border-t border-white/5 hover:bg-white/3 transition">
                      <td className="py-3 font-medium text-white">{f.flightNo ?? f.code}</td>
                      <td className="text-white/60 text-xs">{f.model}</td>
                      <td className={statusColor(f.status)}>{f.status}</td>
                      <td className="text-white/70">{f.route}</td>
                      <td className="text-white/55 text-xs">{dep}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${loadColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/55 w-8 text-right">%{pct}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Kaynak Tahsisi">
          {usage.loading || !usage.data ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : usage.error ? (
            <ErrorState onRetry={usage.reload} />
          ) : (
            usage.data.map(({ icon, label, v }) => {
              const Icon = ICONS[icon] || Plane;
              return (
                <div key={label} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-white/85">
                      <Icon size={14} className="text-thy" /> {label}
                    </span>
                    <span className="text-white/70">{v}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-thy to-red-400 rounded-full"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}

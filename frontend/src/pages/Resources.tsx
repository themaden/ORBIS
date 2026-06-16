import { Card, Stat } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import { useApi } from "../hooks/useApi";
import { Plane, Users, Hotel, Wrench, type LucideIcon } from "lucide-react";
import { getResourceFleet, getResourceStats, getResourceUsage } from "../api/irrops";

const ICONS: Record<string, LucideIcon> = { Plane, Users, Hotel, Wrench };

const colorFor = (s: string) =>
  s === "Uçuşta" ? "text-emerald-400" :
  s === "Bakımda" ? "text-orange-400" : "text-cyan-400";

export default function Resources() {
  const stats = useApi(() => getResourceStats());
  const fleet = useApi(() => getResourceFleet());
  const usage = useApi(() => getResourceUsage());

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
            <table className="w-full text-sm min-w-[480px]">
              <thead className="text-white/50 text-left text-xs uppercase">
                <tr>
                  <th className="py-2">Kuyruk No</th>
                  <th>Model</th>
                  <th>Durum</th>
                  <th>Rota</th>
                  <th className="w-32">İlerleme</th>
                </tr>
              </thead>
              <tbody>
                {fleet.data.map((f) => (
                  <tr key={f.code} className="border-t border-white/5">
                    <td className="py-3 font-medium">{f.code}</td>
                    <td className="text-white/70">{f.model}</td>
                    <td className={colorFor(f.status)}>{f.status}</td>
                    <td className="text-white/70">{f.route}</td>
                    <td>
                      <div className="h-1.5 bg-white/10 rounded-full">
                        <div
                          className="h-full bg-thy rounded-full"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
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

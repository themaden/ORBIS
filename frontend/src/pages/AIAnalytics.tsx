import { Card, Stat } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import type { Analytics } from "../types";

const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Cpu,
};

export default function AIAnalytics() {
  const { data, loading, error, reload } = useApi<Analytics>(() =>
    api.getAnalytics()
  );

  if (loading || !data) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <ErrorState message="Analiz verisi yüklenemedi" onRetry={reload} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {data.stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Aylık Gecikme Tahminleri (saat)" className="lg:col-span-2">
          <div className="flex items-end gap-3 h-56 px-2">
            {data.bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-thy to-red-400"
                  style={{ height: `${b}%`, opacity: 0.85 }}
                />
                <span className="text-[11px] text-white/50">
                  {data.months[i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Aktif Modeller">
          <ul className="space-y-3 text-sm">
            {data.models.map(({ name, v, icon }) => {
              const Icon = ICONS[icon] || Cpu;
              return (
                <li key={name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white/85">
                    <Icon size={15} className="text-thy" /> {name}
                  </span>
                  <span className="text-emerald-400 font-medium">{v}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Yapay Zeka Önerileri" className="lg:col-span-3">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {data.suggestions.map((t, i) => (
              <li
                key={i}
                className="bg-white/5 rounded-xl p-4 border border-white/10 leading-relaxed text-white/85"
              >
                <Sparkles size={16} className="text-thy mb-2" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

import { Card, Stat } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import { api } from "../api/client";
import { getModelInfo } from "../api/irrops";
import { useApi } from "../hooks/useApi";
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
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
  const model = useApi(() => getModelInfo());

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
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.bars.map((v, i) => ({ ay: data.months[i], saat: v }))}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="ay"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "#14080a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="saat" fill="#E30A17" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

        {model.data && (
          <Card title="ML Model — Gerçek Holdout Metrikleri" className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Metric label="MAE (dk)" value={model.data.maeMin.toString()} accent="text-emerald-400" />
              <Metric label="RMSE (dk)" value={model.data.rmseMin.toString()} />
              <Metric label="AUC" value={model.data.auc.toString()} accent="text-cyan-400" />
              <Metric
                label="Eğitim / Test"
                value={`${model.data.nTrain} / ${model.data.nTest}`}
              />
            </div>
            <div className="mt-4">
              <div className="text-[11px] text-white/55 uppercase tracking-wider mb-2">
                Özellik Önemi
              </div>
              <div className="space-y-2">
                {Object.entries(model.data.featureImportances)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <div key={k}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-white/80">{k}</span>
                        <span className="text-white/55">{(v * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-thy to-red-400 rounded-full"
                          style={{ width: `${v * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-full border ${
                  model.data.dataSource.startsWith("synthetic")
                    ? "text-orange-300 border-orange-500/40 bg-orange-500/10"
                    : "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                }`}
              >
                Veri: {model.data.dataSource}
              </span>
              <span className="text-white/45">
                {model.data.delayModel} · {model.data.note}
              </span>
            </div>
          </Card>
        )}

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

function Metric({ label, value, accent = "text-white" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
      <div className="text-[10px] text-white/55 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold mt-1 ${accent}`}>{value}</div>
    </div>
  );
}

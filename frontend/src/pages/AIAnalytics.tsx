// AIAnalytics — gerçek DB + AI verisi, mock yok
import { useState, useEffect } from "react";
import { Card, Stat } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import {
  getModelInfo, getAnalytics, getModelVersions,
  getAccuracyStats, triggerRetrain, getRetrainStatus,
} from "../api/irrops";
import { useApi } from "../hooks/useApi";
import {
  TrendingUp, AlertTriangle, Sparkles, Cpu,
  RefreshCw, Check, History, Target,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from "recharts";

const ICONS: Record<string, LucideIcon> = { TrendingUp, AlertTriangle, Sparkles, Cpu };

export default function AIAnalytics() {
  const analytics = useApi(() => getAnalytics());
  const model = useApi(() => getModelInfo());
  const versions = useApi(() => getModelVersions());
  const accuracy = useApi(() => getAccuracyStats());

  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  // Yeniden eğitim durumunu poll et
  useEffect(() => {
    if (!retraining) return;
    const iv = setInterval(async () => {
      try {
        const st = await getRetrainStatus();
        if (!st.running) {
          setRetraining(false);
          clearInterval(iv);
          if (st.error) {
            setRetrainMsg(`Hata: ${st.error}`);
          } else {
            setRetrainMsg("Yeniden eğitim tamamlandı — model güncellendi.");
            versions.reload();
            model.reload();
          }
        }
      } catch { /* AI servisi henüz hazır değil */ }
    }, 3000);
    return () => clearInterval(iv);
  }, [retraining]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetrain = async () => {
    setRetrainMsg(null);
    setRetraining(true);
    try {
      await triggerRetrain(500_000);
    } catch {
      setRetraining(false);
      setRetrainMsg("AI servisi (8000) erişilemiyor.");
    }
  };

  if (analytics.loading && !analytics.data) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <ErrorState message="Analiz verisi yüklenemedi — backend çalışıyor mu?" onRetry={analytics.reload} />
        </Card>
      </div>
    );
  }

  const data = analytics.data!;

  const topStats = model.data
    ? [
        { label: "Tahmin Doğruluğu", value: `%${Math.round(model.data.auc * 100)}`, hint: `AUC ${model.data.auc}`, accent: "text-emerald-400" },
        { label: "Ortalama Hata", value: `${model.data.maeMin} dk`, hint: `RMSE ${model.data.rmseMin}`, accent: "text-white" },
        { label: "Eğitim Verisi", value: `${(model.data.nTrain / 1000).toFixed(0)}K`, hint: model.data.dataSource.split("·")[0]?.trim() || "BTS 2008", accent: "text-cyan-400" },
        { label: "AI Tespit", value: data.stats.find(s => s.label === "AI Tespiti")?.value ?? "0", hint: "Proaktif uyarı", accent: "text-thy" },
      ]
    : data.stats;

  const versionList = versions.data ?? [];
  const acc = accuracy.data;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {topStats.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Saatlik Risk Grafiği */}
        <Card title="Saatlik Gecikme Riski Dağılımı (BTS 2024 Gerçek Veri)" className="lg:col-span-2">
          {(!data.hourlyRisk || data.hourlyRisk.length === 0) ? (
            <div className="h-56 flex items-center justify-center text-white/40 text-sm">
              Saatlik veri yok — seed:bts çalıştırıldı mı?
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.hourlyRisk}
                  margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="saat" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ background: "#14080a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v, name) =>
                      name === "risk" ? [`%${v}`, "Risk Skoru"] :
                      name === "gecikme" ? [`${v} dk`, "Ort. Gecikme"] :
                      [`${v}`, "Uçuş Sayısı"]
                    }
                  />
                  <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
                    {data.hourlyRisk.map((row: any, i: number) => (
                      <Cell
                        key={i}
                        fill={row.risk >= 70 ? "#E30A17" : row.risk >= 50 ? "#f97316" : "#22c55e"}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.delayTypes && data.delayTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {data.delayTypes.map((d: any) => (
                <span key={d.tip} className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/70">
                  {d.tip}: <span className="font-semibold text-white">{d.sayi}</span>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Aktif modeller */}
        <Card title="Aktif Modeller">
          <ul className="space-y-3 text-sm">
            {data.models.map(({ name, v, icon }) => {
              const Icon = ICONS[icon] || Cpu;
              return (
                <li key={name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white/85">
                    <Icon size={15} className="text-thy" /> {name}
                  </span>
                  <span className="text-emerald-400 font-medium text-xs">{v}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* ML Holdout metrikleri */}
        {model.data && (
          <Card title="ML Model — Gerçek Holdout Metrikleri" className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Metric label="MAE (dk)" value={model.data.maeMin.toString()} accent="text-emerald-400" />
              <Metric label="RMSE (dk)" value={model.data.rmseMin.toString()} />
              <Metric label="AUC" value={model.data.auc.toString()} accent="text-cyan-400" />
              <Metric label="Eğitim / Test" value={`${(model.data.nTrain/1000).toFixed(0)}K / ${(model.data.nTest/1000).toFixed(0)}K`} />
              <Metric label="Precision" value={model.data.precision.toString()} accent="text-emerald-400" />
              <Metric label="Recall" value={model.data.recall.toString()} accent="text-cyan-400" />
              <Metric label="F1" value={model.data.f1.toString()} accent="text-thy" />
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-white/55 uppercase tracking-wider mb-1">Confusion (&gt;30dk)</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className="text-emerald-400">TP {model.data.confusion.tp}</span>
                  <span className="text-orange-400">FP {model.data.confusion.fp}</span>
                  <span className="text-thy">FN {model.data.confusion.fn}</span>
                  <span className="text-white/60">TN {model.data.confusion.tn}</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[11px] text-white/55 uppercase tracking-wider mb-2">Özellik Önemi</div>
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
                        <div className="h-full bg-gradient-to-r from-thy to-red-400 rounded-full" style={{ width: `${v * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded-full border ${
                model.data.dataSource.startsWith("synthetic")
                  ? "text-orange-300 border-orange-500/40 bg-orange-500/10"
                  : "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
              }`}>
                {model.data.dataSource}
              </span>
              <span className="text-white/45">{model.data.note}</span>
            </div>
          </Card>
        )}

        {/* Üretim Doğruluk Takibi */}
        <Card title="Üretim Doğruluk Takibi">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-thy" />
            <span className="text-xs text-white/60">Gerçekleşen uçuşlarla karşılaştırma</span>
          </div>
          {acc ? (
            <div className="space-y-3">
              <AccRow label="Toplam Tahmin" value={acc.db.totalPredictions.toString()} />
              <AccRow label="Doğrulanan" value={acc.db.verifiedCount.toString()} />
              <AccRow
                label="±30 dk Doğruluk"
                value={acc.db.accuracy30 !== null ? `%${Math.round(acc.db.accuracy30 * 100)}` : "—"}
                accent="text-emerald-400"
              />
              <AccRow label="Ort. Mutlak Hata" value={`${acc.db.avgAbsError} dk`} />
              {acc.ai && (
                <>
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="text-[10px] text-white/40 uppercase mb-2">AI Servis (in-memory)</div>
                    <AccRow label="Toplam Feedback" value={acc.ai.totalPredictions.toString()} />
                    <AccRow
                      label="±30 dk"
                      value={acc.ai.totalPredictions > 0 ? `%${Math.round(acc.ai.accuracy30 * 100)}` : "—"}
                      accent="text-cyan-400"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-xs text-white/40">Yükleniyor…</div>
          )}
        </Card>

        {/* Model Versiyon Geçmişi + Yeniden Eğitim */}
        <Card title="Model Versiyonlama" className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-white/55">
              <History size={13} className="text-thy" />
              Her yeniden eğitim otomatik versiyonlanır — rollback için önceki .joblib dosyaları korunur
            </div>
            <div className="flex items-center gap-2">
              {retrainMsg && (
                <span className={`text-xs flex items-center gap-1 ${retrainMsg.startsWith("Hata") ? "text-thy" : "text-emerald-400"}`}>
                  {!retrainMsg.startsWith("Hata") && <Check size={12} />}
                  {retrainMsg}
                </span>
              )}
              <button
                onClick={handleRetrain}
                disabled={retraining}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-thy hover:bg-red-600 disabled:opacity-50 text-sm font-medium transition"
              >
                <RefreshCw size={14} className={retraining ? "animate-spin" : ""} />
                {retraining ? "Eğitiliyor…" : "Yeniden Eğit"}
              </button>
            </div>
          </div>

          {versionList.length === 0 ? (
            <div className="text-sm text-white/45">
              Henüz versiyon kaydı yok. İlk eğitim sonrası burada görünecek.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-white/80">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Versiyon", "Eğitim Tarihi", "Veri Kaynağı", "MAE", "AUC", "F1", "Eğitim / Test", "Durum"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-white/40 font-medium uppercase tracking-wide text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...versionList].reverse().map((v) => (
                    <tr key={v.version} className="border-b border-white/5 hover:bg-white/3">
                      <td className="py-2 pr-4 font-mono text-white/70">{v.version.slice(0, 10)}</td>
                      <td className="py-2 pr-4">{new Date(v.trainedAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2 pr-4 max-w-[180px] truncate text-white/55">{v.source.split("·")[0]?.trim()}</td>
                      <td className="py-2 pr-4 text-emerald-400">{v.mae} dk</td>
                      <td className="py-2 pr-4 text-cyan-400">{v.auc}</td>
                      <td className="py-2 pr-4">{v.f1}</td>
                      <td className="py-2 pr-4 text-white/55">{(v.nTrain/1000).toFixed(0)}K / {(v.nTest/1000).toFixed(0)}K</td>
                      <td className="py-2 pr-4">
                        {v.active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Aktif</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/35 border border-white/10">Arşiv</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* AI Önerileri */}
        <Card title="Yapay Zeka Önerileri (Canlı)" className="lg:col-span-3">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {data.suggestions.map((t, i) => (
              <li key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 leading-relaxed text-white/85">
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

function AccRow({ label, value, accent = "text-white/85" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/50">{label}</span>
      <span className={`font-medium ${accent}`}>{value}</span>
    </div>
  );
}

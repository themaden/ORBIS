import { useState, useCallback } from "react";
import { Card } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import { useApi } from "../hooks/useApi";
import {
  explainDelay,
  getPartialDependence,
  getFeatureImportance,
  FEATURE_LABELS,
  PD_FEATURES,
  type DelayExplanation,
  type ExplainRequest,
  type PartialDependenceResponse,
  type FeatureImportanceResponse,
  type PDFeature,
} from "../api/explainability";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Gauge,
  Plane,
  CloudLightning,
  Users,
  Clock,
  Search,
  BarChart3,
} from "lucide-react";

// ---- Sabitler ----

const DEFAULT_REQ: ExplainRequest = {
  departureHour: 18,
  loadFactor: 0.85,
  routeHaulHours: 6.5,
  weatherSeverity: 0.4,
};

const BAND_COLORS: Record<string, string> = {
  Yüksek: "text-red-400",
  Orta: "text-amber-400",
  Düşük: "text-emerald-400",
};

const BAND_BG: Record<string, string> = {
  Yüksek: "from-red-500/20 to-red-600/5 border-red-500/30",
  Orta: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  Düşük: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
};

const FEATURE_ICONS: Record<string, typeof Clock> = {
  departureHour: Clock,
  loadFactor: Users,
  routeHaulHours: Plane,
  weatherSeverity: CloudLightning,
};

const DIRECTION_ICON: Record<string, typeof TrendingUp> = {
  "↑ arttırıyor": TrendingUp,
  "↓ azaltıyor": TrendingDown,
  "→ etkisiz": ArrowRight,
};

const PD_COLORS: Record<PDFeature, string> = {
  departureHour: "#60a5fa",
  loadFactor: "#f59e0b",
  routeHaulHours: "#a78bfa",
  weatherSeverity: "#f87171",
};

// ---- Sayfa ----

export default function Explainability() {
  const [form, setForm] = useState<ExplainRequest>(DEFAULT_REQ);
  const [explanation, setExplanation] = useState<DelayExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePD, setActivePD] = useState<PDFeature>("weatherSeverity");
  const [pdData, setPdData] = useState<PartialDependenceResponse | null>(null);
  const [pdLoading, setPdLoading] = useState(false);

  // Global feature importance — sayfa açılışında bir kere çek
  const fi = useApi<FeatureImportanceResponse>(() => getFeatureImportance());

  // Explain çağrısı
  const handleExplain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await explainDelay(form);
      setExplanation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Partial Dependence çağrısı
  const handlePD = useCallback(async (feature: PDFeature) => {
    setActivePD(feature);
    setPdLoading(true);
    try {
      const data = await getPartialDependence(feature);
      setPdData(data);
    } catch {
      setPdData(null);
    } finally {
      setPdLoading(false);
    }
  }, []);

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-5">
      {/* Başlık Kartı */}
      <div className="glass rounded-2xl p-5 bg-gradient-to-r from-white/5 to-transparent border border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-thy to-red-600 flex items-center justify-center">
            <Lightbulb size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg" id="explainability-title">
              Model Açıklanabilirliği
            </h2>
            <p className="text-xs text-white/55">
              SHAP yerine hafif yerel açıklayıcı — Gerçek zamanlı, &lt;5ms latency
            </p>
          </div>
        </div>
      </div>

      {/* Ana İçerik: Sol Giriş + Sağ Sonuç */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ────────────────── SOL PANEL: Giriş Parametreleri ────────────────── */}
        <div className="xl:col-span-4 space-y-5">
          <Card title="Senaryo Parametreleri">
            <div className="space-y-5">
              <SliderField
                id="inp-departure-hour"
                label="Kalkış Saati"
                icon={Clock}
                value={form.departureHour}
                min={0}
                max={23}
                step={1}
                display={`${form.departureHour}:00`}
                onChange={(v) => setForm((f) => ({ ...f, departureHour: v }))}
              />
              <SliderField
                id="inp-load-factor"
                label="Doluluk Oranı"
                icon={Users}
                value={form.loadFactor}
                min={0.5}
                max={1}
                step={0.01}
                display={`${(form.loadFactor * 100).toFixed(0)}%`}
                onChange={(v) => setForm((f) => ({ ...f, loadFactor: v }))}
              />
              <SliderField
                id="inp-haul-hours"
                label="Rota Süresi"
                icon={Plane}
                value={form.routeHaulHours}
                min={1}
                max={14}
                step={0.5}
                display={`${form.routeHaulHours}h`}
                onChange={(v) =>
                  setForm((f) => ({ ...f, routeHaulHours: v }))
                }
              />
              <SliderField
                id="inp-weather"
                label="Hava Şiddeti"
                icon={CloudLightning}
                value={form.weatherSeverity}
                min={0}
                max={1}
                step={0.05}
                display={`${(form.weatherSeverity * 100).toFixed(0)}%`}
                onChange={(v) =>
                  setForm((f) => ({ ...f, weatherSeverity: v }))
                }
              />
            </div>

            <button
              id="btn-explain"
              onClick={handleExplain}
              disabled={loading}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-thy to-red-700 hover:from-red-600 hover:to-red-800
                         transition-all duration-300 shadow-lg shadow-red-900/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={16} />
                  Tahmini Açıkla
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 text-sm text-red-400 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                ⚠ {error}
              </div>
            )}
          </Card>

          {/* Global Feature Importance */}
          <Card title="Global Özellik Ağırlıkları">
            {fi.loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : fi.error ? (
              <ErrorState
                message="Özellik ağırlıkları yüklenemedi"
                onRetry={fi.reload}
              />
            ) : fi.data ? (
              <div className="space-y-3">
                {fi.data.ranking.map(([name, val]) => {
                  const Icon = FEATURE_ICONS[name] || Gauge;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-white/80">
                          <Icon size={12} className="text-thy" />
                          {FEATURE_LABELS[name] || name}
                        </span>
                        <span className="text-white/55 font-mono">
                          {(val * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${val * 100}%`,
                            background: `linear-gradient(90deg, #E30A17, ${val > 0.2 ? "#f97316" : "#ef4444"})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-white/40 mt-2">
                  {fi.data.note}
                </p>
              </div>
            ) : null}
          </Card>
        </div>

        {/* ────────────────── SAĞ PANEL: Sonuçlar ────────────────── */}
        <div className="xl:col-span-8 space-y-5">
          {/* Açıklama Sonucu */}
          {!explanation && !loading && (
            <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-dashed border-white/15">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-thy/70" />
              </div>
              <p className="text-white/55 text-sm max-w-sm">
                Parametreleri ayarlayın ve <strong>Tahmini Açıkla</strong>'ya
                tıklayarak modelin gecikme tahmininin nedenlerini keşfedin.
              </p>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
              <Skeleton className="h-64 md:col-span-3 rounded-2xl" />
            </div>
          )}

          {explanation && !loading && (
            <>
              {/* KPI Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResultKPI
                  label="Tahmini Gecikme"
                  value={`${explanation.prediction} dk`}
                  band={explanation.band}
                />
                <ResultKPI
                  label="Gecikme Olasılığı"
                  value={`${(explanation.probability * 100).toFixed(1)}%`}
                  band={explanation.band}
                />
                <ResultKPI
                  label="En Etkili Faktör"
                  value={FEATURE_LABELS[explanation.top_factor] || explanation.top_factor}
                  band={explanation.band}
                />
              </div>

              {/* Insight Kartı */}
              <div
                className={`glass rounded-2xl p-4 border bg-gradient-to-r ${BAND_BG[explanation.band] || BAND_BG["Düşük"]}`}
              >
                <div className="flex items-start gap-3">
                  <Lightbulb
                    size={18}
                    className={BAND_COLORS[explanation.band] || "text-white"}
                  />
                  <p className="text-sm text-white/85 leading-relaxed">
                    {explanation.insight}
                  </p>
                </div>
              </div>

              {/* Feature Katkı (Waterfall-style) */}
              <Card title="Özellik Katkıları (Local Açıklama)">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={explanation.features.map((f) => ({
                        name: FEATURE_LABELS[f.name] || f.name,
                        contribution: f.contribution,
                        direction: f.direction,
                        fullName: f.name,
                      }))}
                      layout="vertical"
                      margin={{ top: 4, right: 30, bottom: 4, left: 10 }}
                    >
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.06)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fill: "rgba(255,255,255,0.5)",
                          fontSize: 11,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{
                          fill: "rgba(255,255,255,0.7)",
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{
                          background: "#14080a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(val, _name, props) => {
                          const v = Number(val);
                          const dir = (props?.payload as { direction?: string })?.direction ?? "";
                          return [`${v.toFixed(4)} (${dir})`, "Katkı"];
                        }}
                      />
                      <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                      <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
                        {explanation.features.map((f, i) => (
                          <Cell
                            key={i}
                            fill={
                              f.direction.includes("arttırıyor")
                                ? "#ef4444"
                                : f.direction.includes("azaltıyor")
                                  ? "#22c55e"
                                  : "#6b7280"
                            }
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detay Tablosu */}
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="grid grid-cols-4 gap-2 text-[10px] text-white/50 uppercase tracking-wider mb-2 px-1">
                    <span>Özellik</span>
                    <span className="text-right">Girdi</span>
                    <span className="text-right">Önem</span>
                    <span className="text-right">Yön</span>
                  </div>
                  {explanation.features.map((f) => {
                    const Icon = FEATURE_ICONS[f.name] || Gauge;
                    const DirIcon = DIRECTION_ICON[f.direction] || ArrowRight;
                    return (
                      <div
                        key={f.name}
                        className="grid grid-cols-4 gap-2 items-center py-2 px-1 rounded-lg hover:bg-white/5 transition text-sm"
                      >
                        <span className="flex items-center gap-1.5 text-white/80">
                          <Icon size={13} className="text-thy" />
                          {FEATURE_LABELS[f.name] || f.name}
                        </span>
                        <span className="text-right font-mono text-white/65">
                          {f.value.toFixed(3)}
                        </span>
                        <span className="text-right font-mono text-white/65">
                          {(f.importance * 100).toFixed(1)}%
                        </span>
                        <span className="text-right flex items-center justify-end gap-1">
                          <DirIcon
                            size={13}
                            className={
                              f.direction.includes("arttırıyor")
                                ? "text-red-400"
                                : f.direction.includes("azaltıyor")
                                  ? "text-emerald-400"
                                  : "text-white/40"
                            }
                          />
                          <span
                            className={`text-xs ${
                              f.direction.includes("arttırıyor")
                                ? "text-red-400"
                                : f.direction.includes("azaltıyor")
                                  ? "text-emerald-400"
                                  : "text-white/40"
                            }`}
                          >
                            {f.direction}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          {/* ──── Partial Dependence ──── */}
          <Card title="Partial Dependence — Özellik Etkisi">
            <div className="flex gap-2 mb-4 flex-wrap">
              {PD_FEATURES.map((feat) => (
                <button
                  key={feat}
                  id={`btn-pd-${feat}`}
                  onClick={() => handlePD(feat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activePD === feat
                      ? "bg-thy text-white shadow-lg shadow-red-900/30"
                      : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  {FEATURE_LABELS[feat]}
                </button>
              ))}
            </div>

            {pdLoading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : pdData ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={pdData.values}
                    margin={{ top: 8, right: 16, bottom: 4, left: -8 }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="feature_value"
                      tick={{
                        fill: "rgba(255,255,255,0.5)",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: FEATURE_LABELS[activePD],
                        position: "insideBottom",
                        offset: -2,
                        fill: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      yAxisId="min"
                      tick={{
                        fill: "rgba(255,255,255,0.5)",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Gecikme (dk)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 14,
                        fill: "rgba(255,255,255,0.35)",
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      yAxisId="prob"
                      orientation="right"
                      domain={[0, 1]}
                      tick={{
                        fill: "rgba(255,255,255,0.4)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Olasılık",
                        angle: 90,
                        position: "insideRight",
                        offset: 14,
                        fill: "rgba(255,255,255,0.3)",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#14080a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(val, name) => {
                        const v = Number(val);
                        return [
                          name === "prediction_min"
                            ? `${v.toFixed(1)} dk`
                            : `${(v * 100).toFixed(1)}%`,
                          name === "prediction_min"
                            ? "Gecikme"
                            : "Olasılık",
                        ];
                      }}
                    />
                    <Line
                      yAxisId="min"
                      type="monotone"
                      dataKey="prediction_min"
                      stroke={PD_COLORS[activePD]}
                      strokeWidth={2.5}
                      dot={{ fill: PD_COLORS[activePD], r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="prob"
                      type="monotone"
                      dataKey="probability"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={{ fill: "#94a3b8", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-white/40 text-sm">
                <BarChart3 size={20} className="mr-2 opacity-50" />
                Bir özellik seçerek etkisini görüntüleyin
              </div>
            )}

            {pdData && (
              <p className="text-[10px] text-white/40 mt-3">
                Diğer değişkenler sabit tutularak, {FEATURE_LABELS[activePD].toLowerCase()} değiştirildikçe
                tahmini gecikme ve olasılığın nasıl değiştiğini gösterir.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---- Alt Bileşenler ----

function SliderField({
  id,
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof Clock;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-sm text-white/80"
        >
          <Icon size={14} className="text-thy" />
          {label}
        </label>
        <span className="text-sm font-mono font-semibold text-white/90 bg-white/8 px-2 py-0.5 rounded-md">
          {display}
        </span>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-thy
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-red-900/50
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30
                     [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-thy
                     [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/30"
          style={{
            background: `linear-gradient(90deg, #E30A17 0%, #E30A17 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function ResultKPI({
  label,
  value,
  band,
}: {
  label: string;
  value: string;
  band: string;
}) {
  return (
    <div
      className={`glass rounded-2xl p-4 border bg-gradient-to-br ${BAND_BG[band] || BAND_BG["Düşük"]}`}
    >
      <div className="text-[10px] text-white/55 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-2xl font-bold mt-1.5 ${BAND_COLORS[band] || "text-white"}`}
      >
        {value}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            band === "Yüksek"
              ? "bg-red-400 animate-pulse"
              : band === "Orta"
                ? "bg-amber-400"
                : "bg-emerald-400"
          }`}
        />
        <span className="text-[11px] text-white/50">{band} Risk</span>
      </div>
    </div>
  );
}

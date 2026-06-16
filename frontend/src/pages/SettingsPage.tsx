import { Card } from "../components/Card";
import { useEffect, useState } from "react";
import {
  Bell, Globe, Moon, Shield, KeyRound, Save, RotateCcw,
  ShieldCheck, AlertTriangle, Check, type LucideIcon,
} from "lucide-react";
import { applyTheme } from "../theme";
import { useApi } from "../hooks/useApi";
import {
  getCostParams, updateCostParams, getGdprSummary,
  type CostParam,
} from "../api/irrops";

const STORAGE_KEY = "orbis.settings";

type OptKey = "notify" | "dark" | "alerts" | "twofa";
type Options = Record<OptKey, boolean>;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`w-11 h-6 rounded-full transition relative ${checked ? "bg-thy" : "bg-white/15"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

const DEFAULTS: Options = { notify: true, dark: true, alerts: true, twofa: false };

// ---- Parametre açıklamaları ----
const PARAM_META: Record<string, { label: string; unit: string; min: number; max: number; step: number }> = {
  hotel_unit:             { label: "Gecelik Otel Maliyeti",         unit: "USD", min: 0,    max: 500,   step: 5  },
  meal_unit:              { label: "İkram Maliyeti",                 unit: "USD", min: 0,    max: 100,   step: 1  },
  transfer_unit:          { label: "Transfer Maliyeti",              unit: "USD", min: 0,    max: 200,   step: 5  },
  delay_penalty_per_min:  { label: "Gecikme Cezası (dk başı)",      unit: "USD", min: 0,    max: 10,    step: 0.1 },
  w_loyalty:              { label: "Skor Ağırlığı: Sadakat",        unit: "pt",  min: 0,    max: 100,   step: 1  },
  w_class:                { label: "Skor Ağırlığı: Bilet Sınıfı",  unit: "pt",  min: 0,    max: 100,   step: 1  },
  w_connection:           { label: "Skor Ağırlığı: Bağlantı",       unit: "pt",  min: 0,    max: 100,   step: 1  },
  w_special:              { label: "Skor Ağırlığı: Özel İhtiyaç",  unit: "pt",  min: 0,    max: 100,   step: 1  },
};

// ---- Maliyet Parametreleri Paneli ----
function CostParamsPanel() {
  const { data: params, loading, reload } = useApi(() => getCostParams());
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (params) {
      setDraft(Object.fromEntries(params.map((p) => [p.key, p.value])));
    }
  }, [params]);

  const handleChange = (key: string, val: number) => {
    setDraft((d) => ({ ...d, [key]: val }));
    setSaved(false);
  };

  const handleReset = () => {
    if (params) setDraft(Object.fromEntries(params.map((p) => [p.key, p.value])));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(draft).map(([key, value]) => ({ key, value }));
      await updateCostParams(updates);
      setSaved(true);
      reload();
    } catch {
      /* hata sessizce geçilir */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-white/40 py-4">Yükleniyor…</div>;

  const displayParams = params ?? [];
  // Ağırlıklar ve maliyetler grupla
  const costs = displayParams.filter((p) => !p.key.startsWith("w_"));
  const weights = displayParams.filter((p) => p.key.startsWith("w_"));

  return (
    <div className="space-y-6">
      {[["Bakım Maliyetleri", costs], ["Öncelik Ağırlıkları (Toplam 100 pt)", weights]].map(([groupLabel, items]) => (
        <div key={groupLabel as string}>
          <div className="text-xs text-white/40 uppercase tracking-wide mb-3">{groupLabel as string}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(items as CostParam[]).map((p) => {
              const meta = PARAM_META[p.key];
              const val = draft[p.key] ?? p.value;
              return (
                <div key={p.key} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium">{meta?.label ?? p.key}</div>
                      {p.note && <div className="text-[11px] text-white/40">{p.note}</div>}
                    </div>
                    <div className="text-thy font-bold text-sm">
                      {meta?.unit === "pt" ? val.toFixed(0) : val.toFixed(meta?.unit === "USD" && p.key === "delay_penalty_per_min" ? 1 : 0)} {meta?.unit}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={meta?.min ?? 0}
                    max={meta?.max ?? 100}
                    step={meta?.step ?? 1}
                    value={val}
                    onChange={(e) => handleChange(p.key, parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-thy cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>{meta?.min}</span>
                    <span>{meta?.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-thy hover:bg-red-600 disabled:opacity-50 text-sm font-medium transition"
        >
          <Save size={14} /> {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition"
        >
          <RotateCcw size={14} /> Sıfırla
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={13} /> Kaydedildi
          </span>
        )}
      </div>
    </div>
  );
}

// ---- GDPR Paneli ----
function GdprPanel() {
  const { data, loading, reload } = useApi(() => getGdprSummary());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const handleAnonymizeAll = async () => {
    if (!confirmAll) { setConfirmAll(true); return; }
    setBusy(true);
    setConfirmAll(false);
    try {
      const r = await fetch("/api/settings/gdpr/anonymize-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("orbis_token")}` },
        body: JSON.stringify({ filter: "no-booking" }),
      });
      const d = await r.json();
      setMsg(`${d.anonymized} yolcu anonimleştirildi.`);
      reload();
    } catch {
      setMsg("İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-sm text-white/40 py-4">Yükleniyor…</div>;
  if (!data) return null;

  const pct = data.totalPassengers > 0 ? Math.round((data.anonymized / data.totalPassengers) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <ShieldCheck size={16} className="text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-300 leading-relaxed">{data.gdprNote}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Toplam Yolcu", value: data.totalPassengers, color: "text-white" },
          { label: "E-posta Var", value: data.withEmail, color: "text-orange-400" },
          { label: "Telefon Var", value: data.withPhone, color: "text-orange-400" },
          { label: "Anonimleştirilmiş", value: data.anonymized, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs text-white/55 mb-1.5">
          <span>Anonimleştirme oranı</span>
          <span>%{pct}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleAnonymizeAll}
          disabled={busy}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
            confirmAll
              ? "bg-red-600 hover:bg-red-700"
              : "bg-white/10 hover:bg-white/15"
          }`}
        >
          <ShieldCheck size={14} />
          {busy ? "Anonimleştiriliyor…" : confirmAll ? "Onaylıyor musunuz? (Geri alınamaz)" : "Rezervasyonsuz Yolcuları Anonimleştir"}
        </button>
        {confirmAll && (
          <button onClick={() => setConfirmAll(false)} className="text-xs text-white/50 hover:text-white transition">
            İptal
          </button>
        )}
        {msg && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} /> {msg}
          </span>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
        <p className="text-xs text-orange-300 leading-relaxed">
          Toplu anonimleştirme geri alınamaz. Yalnızca aktif rezervasyonu olmayan yolcular etkilenir.
          Bireysel yolcu anonimleştirme için IRROPS &gt; Yolcu listesini kullanın.
        </p>
      </div>
    </div>
  );
}

// ---- Ana Sayfa ----
export default function SettingsPage() {
  const [opts, setOpts] = useState<Options>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(opts)); } catch { /* pass */ }
  }, [opts]);

  const set = (k: OptKey) => (v: boolean) => {
    setOpts((o) => ({ ...o, [k]: v }));
    if (k === "dark") applyTheme(v);
  };

  const prefs: { k: OptKey; icon: LucideIcon; label: string; desc: string }[] = [
    { k: "notify", icon: Bell,     label: "Bildirimler",          desc: "Tüm push bildirimleri" },
    { k: "dark",   icon: Moon,     label: "Koyu Mod",             desc: "Komuta merkezi teması" },
    { k: "alerts", icon: Shield,   label: "Kriz Uyarıları",       desc: "Yüksek riskli uçuş anında uyar" },
    { k: "twofa",  icon: KeyRound, label: "İki Adımlı Doğrulama", desc: "Giriş güvenliği" },
  ];

  const region: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Dil",         value: "Türkçe",         icon: Globe },
    { label: "Saat Dilimi", value: "GMT+3 (İstanbul)", icon: Globe },
    { label: "Para Birimi", value: "TRY (₺)",         icon: Globe },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profil */}
        <Card title="Profil">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-thy flex items-center justify-center text-2xl font-bold">
              AY
            </div>
            <div>
              <div className="font-semibold">Ahmet Yılmaz</div>
              <div className="text-xs text-white/60">Operasyon Yöneticisi · IOCC</div>
              <div className="text-xs text-white/40 mt-1">maden3438@gmail.com</div>
            </div>
          </div>
          <button className="w-full mt-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition">
            Profili Düzenle
          </button>
        </Card>

        {/* Tercihler */}
        <Card title="Tercihler" className="lg:col-span-2">
          {prefs.map(({ k, icon: Icon, label, desc }) => (
            <div key={k} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon size={16} className="text-thy" />
                </div>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-white/55">{desc}</div>
                </div>
              </div>
              <Toggle checked={opts[k]} onChange={set(k)} label={label} />
            </div>
          ))}
        </Card>

        {/* Dil ve Bölge */}
        <Card title="Dil ve Bölge" className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {region.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <Icon size={13} className="text-thy" /> {label}
                </div>
                <div className="mt-2 font-medium">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Maliyet Parametreleri Admin */}
        <Card title="Maliyet ve Öncelik Parametreleri (Admin)" className="lg:col-span-3">
          <p className="text-xs text-white/50 mb-4">
            OR-Tools atama algoritmasının kullandığı ağırlıklar ve bakım maliyetleri. Değişiklikler bir sonraki
            öneri üretiminde geçerli olur.
          </p>
          <CostParamsPanel />
        </Card>

        {/* GDPR / KVKK */}
        <Card title="GDPR / KVKK — Yolcu Veri Yönetimi" className="lg:col-span-3">
          <GdprPanel />
        </Card>
      </div>
    </div>
  );
}

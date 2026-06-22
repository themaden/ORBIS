import { useState } from "react";
import {
  AlertTriangle, Plane, Sparkles, Hotel, Utensils, RotateCcw,
  BadgeDollarSign, Check, Bell, GitCompare, X, TrendingDown,
  Euro, Users, Clock,
} from "lucide-react";
import { Card } from "../components/Card";
import { Skeleton } from "../components/Skeleton";
import { useApi } from "../hooks/useApi";
import { useLiveData } from "../context/useLiveData";
import {
  recommend, applyProposal,
  getNotifications, getScenarios,
} from "../api/irrops";
import type { RecommendResult } from "../api/irrops";

const loyaltyColor = (l: string) =>
  l === "ELITE_PLUS" ? "text-thy" : l === "ELITE" ? "text-orange-400" : l === "CLASSIC" ? "text-cyan-400" : "text-white/50";

const careIcon: Record<string, typeof Hotel> = {
  HOTEL: Hotel,
  MEAL: Utensils,
  TRANSFER: RotateCcw,
  REFUND: BadgeDollarSign,
  COMPENSATION: BadgeDollarSign,
};

function fmt(n: number) {
  return n.toLocaleString("tr-TR");
}

// --- Gelir Etkisi Kartı ---
function RevenueCard({ r }: { r: RecommendResult }) {
  const ri = r.revenueImpact;
  if (!ri) return null;
  return (
    <Card title="Tahmini Gelir Etkisi">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MiniStat label="Bakım Maliyeti" value={`€${fmt(ri.totalCare)}`} color="text-cyan-400" />
        <MiniStat
          label="EU261 Tazminat"
          value={ri.eligibleForEu261 ? `€${fmt(ri.totalEu261)}` : "Muaf"}
          color={ri.eligibleForEu261 ? "text-orange-400" : "text-white/40"}
        />
        <MiniStat label="Gelir Erimesi" value={`€${fmt(ri.estimatedRevenueLoss)}`} color="text-red-400" />
        <MiniStat label="Toplam Etki" value={`€${fmt(ri.grandTotal)}`} color="text-thy font-bold" />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-white/55">
        <span>Mesafe: {fmt(ri.distanceKm)} km</span>
        {ri.eligibleForEu261 && <span>· EU261/2004: €{ri.compPerPax}/yolcu</span>}
        {!ri.eligibleForEu261 && <span className="text-emerald-400">· Hava durumu — EU261 muafiyeti</span>}
        <span>· Döviz: {ri.currency}</span>
      </div>
      <div className="mt-3 flex gap-3 flex-wrap">
        {Object.entries(ri.breakdown).map(([k, v]) =>
          v > 0 ? (
            <div key={k} className="flex items-center gap-1.5 text-xs bg-white/5 rounded-lg px-2.5 py-1.5">
              <span className="text-white/50 capitalize">{k === "revenueLoss" ? "gelir" : k}:</span>
              <span className="text-white/85">€{fmt(v)}</span>
            </div>
          ) : null
        )}
      </div>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="text-[11px] text-white/45 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

// --- Bildirim Modal ---
function NotificationsModal({
  disruptionId,
  onClose,
}: {
  disruptionId: string;
  onClose: () => void;
}) {
  const { data, loading } = useApi(() => getNotifications(disruptionId));
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const notif = data?.notifications ?? [];
  const active = notif.find((n) => n.passengerId === selected) ?? notif[0] ?? null;

  const handleSend = (id: string) => {
    setSent((s) => new Set([...s, id]));
  };
  const handleSendAll = () => {
    notif.forEach((n) => setSent((s) => new Set([...s, n.passengerId])));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-white/10">
        {/* Başlık */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-thy" />
            <span className="font-semibold">Yolcu Bildirimleri</span>
            {data && (
              <span className="text-xs text-white/50">
                — {data.flightNo} · {data.route} · {data.totalPassengers} yolcu
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data && sent.size < notif.length && (
              <button
                onClick={handleSendAll}
                className="text-xs px-3 py-1.5 rounded-lg bg-thy hover:bg-red-600 transition font-medium"
              >
                Tümünü Gönder ({notif.length - sent.size})
              </button>
            )}
            {sent.size > 0 && (
              <span className="text-xs text-emerald-400 font-medium">
                <Check size={13} className="inline mr-1" />
                {sent.size} gönderildi
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {loading && <div className="p-6 text-center text-white/50 text-sm">Yükleniyor…</div>}

        {!loading && data && (
          <div className="flex flex-1 overflow-hidden">
            {/* Sol — yolcu listesi */}
            <div className="w-56 border-r border-white/10 overflow-y-auto shrink-0">
              {notif.map((n) => (
                <button
                  key={n.passengerId}
                  onClick={() => setSelected(n.passengerId)}
                  className={`w-full text-left px-3 py-2.5 border-b border-white/5 transition ${
                    active?.passengerId === n.passengerId ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="text-xs font-medium truncate">{n.fullName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        n.status === "ready"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {n.status === "ready" ? "Hazır" : "Bekliyor"}
                    </span>
                    {sent.has(n.passengerId) && (
                      <Check size={11} className="text-emerald-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Sağ — bildirim içeriği */}
            {active && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{active.fullName}</div>
                    <div className="text-xs text-white/50">
                      {active.email} · {active.ticketClass} · {active.loyalty}
                    </div>
                  </div>
                  {!sent.has(active.passengerId) ? (
                    <button
                      onClick={() => handleSend(active.passengerId)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition font-medium"
                    >
                      Gönder
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check size={13} /> Gönderildi
                    </span>
                  )}
                </div>

                {/* SMS */}
                <div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wide mb-1.5">SMS</div>
                  <div className="bg-black/30 rounded-xl p-3 text-xs text-white/85 leading-relaxed border border-white/10">
                    {active.sms}
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">{active.sms.length}/160 karakter</div>
                </div>

                {/* E-posta */}
                <div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wide mb-1.5">E-POSTA</div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                    <div className="text-xs text-white/50 mb-2">
                      Konu: <span className="text-white/80">{active.emailSubject}</span>
                    </div>
                    <pre className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                      {active.emailBody}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Senaryo Karşılaştırma Modal ---
function ScenariosModal({
  disruptionId,
  onClose,
}: {
  disruptionId: string;
  onClose: () => void;
}) {
  const { data, loading } = useApi(() => getScenarios(disruptionId));

  const scoreColor = (s: number) =>
    s >= 75 ? "text-emerald-400" : s >= 50 ? "text-orange-400" : "text-thy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <GitCompare size={18} className="text-thy" />
            <span className="font-semibold">Senaryo Karşılaştırması</span>
            {data && (
              <span className="text-xs text-white/50">
                — {data.flightNo} · {data.route} · {data.paxCount} yolcu · {fmt(data.distanceKm)} km
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {loading && <div className="p-6 text-center text-white/50 text-sm">Hesaplanıyor…</div>}

        {!loading && data && (
          <div className="overflow-y-auto p-4 space-y-4">
            {data.isWeatherExempt && (
              <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-emerald-400">
                <Check size={13} />
                Hava durumu kaynaklı aksaklık — EU261/2004 olağanüstü hal muafiyeti uygulanıyor. Tazminat yükümlülüğü yok.
              </div>
            )}

            {/* Karşılaştırma tablosu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.scenarios.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-2xl p-4 border ${
                    s.operationalScore >= 75
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : s.operationalScore >= 50
                      ? "border-orange-500/20 bg-orange-500/5"
                      : "border-thy/30 bg-thy/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-sm">{s.label}</div>
                    <div className={`text-2xl font-bold ${scoreColor(s.operationalScore)}`}>
                      {s.operationalScore}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {s.delayMin > 0 && (
                      <Row icon={<Clock size={12} />} label="Gecikme" value={`${s.delayMin} dk`} />
                    )}
                    <Row icon={<Users size={12} />} label="Etkilenen" value={`${s.paxImpact} yolcu`} />
                    <Row
                      icon={<Utensils size={12} />}
                      label="İkram"
                      value={s.care.meal > 0 ? `€${fmt(s.care.meal)}` : "—"}
                    />
                    <Row
                      icon={<Hotel size={12} />}
                      label="Otel+Transfer"
                      value={s.care.hotel > 0 ? `€${fmt(s.care.hotel + s.care.transfer)}` : "—"}
                    />
                    <Row
                      icon={<Euro size={12} />}
                      label="EU261"
                      value={s.eu261 > 0 ? `€${fmt(s.eu261)}` : "Yok"}
                      valueClass={s.eu261 > 0 ? "text-orange-400" : "text-white/40"}
                    />
                    <Row
                      icon={<TrendingDown size={12} />}
                      label="Gelir Erimesi"
                      value={`€${fmt(s.revenueLoss)}`}
                      valueClass="text-red-400"
                    />
                    <Row
                      icon={<Plane size={12} />}
                      label="Yeniden Atama"
                      value={`${s.rebookingLoad} yolcu`}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-white/40 uppercase tracking-wide">Toplam Maliyet</span>
                      <span className={`font-bold text-sm ${scoreColor(s.operationalScore)}`}>
                        €{fmt(s.totalCost)}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/55 leading-relaxed">{s.recommendation}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Özet bar */}
            <div className="bg-white/5 rounded-xl p-3 space-y-2">
              <div className="text-xs text-white/50 uppercase tracking-wide mb-2">Maliyet Karşılaştırması</div>
              {data.scenarios.map((s) => {
                const max = Math.max(...data.scenarios.map((x) => x.totalCost));
                const pct = max > 0 ? (s.totalCost / max) * 100 : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="text-xs text-white/60 w-36 shrink-0">{s.label}</div>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.operationalScore >= 75 ? "bg-emerald-500" : s.operationalScore >= 50 ? "bg-orange-500" : "bg-thy"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-white/80 w-20 text-right">
                      €{fmt(s.totalCost)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  icon, label, value, valueClass = "text-white/85",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-white/45">
        {icon}
        <span>{label}</span>
      </div>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

// --- Ana Sayfa ---
export default function Irrops() {
  const { disruptions: list, riskItems, isLoading } = useLiveData();

  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [recErr, setRecErr] = useState("");
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [showNotif, setShowNotif] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  const activeId = chosen ?? list[0]?.id ?? null;
  const active = list.find((d) => d.id === activeId) || null;

  const runRecommend = async () => {
    if (!activeId) return;
    setBusy(true);
    setRecErr("");
    setResult(null);
    try {
      setResult(await recommend(activeId));
    } catch {
      setRecErr("Öneri üretilemedi. Backend (4000) ve AI (8000) çalışıyor mu?");
    } finally {
      setBusy(false);
    }
  };

  const apply = async (passengerId: string, toFlightId: string, toFlightNo: string) => {
    if (!activeId) return;
    try {
      await applyProposal(activeId, passengerId, toFlightId);
      setApplied((a) => ({ ...a, [passengerId]: toFlightNo }));
      // Context'teki aksaklıkları ve uçuşları yenilemek için tüm state'i haberdar eden websocket apply tetikliyor zaten
    } catch {
      setRecErr("Uygulanamadı — backend/oturum kontrol edin.");
    }
  };

  if (isLoading && list.length === 0)
    return <div className="flex-1 p-6"><Skeleton className="h-40 w-full" /></div>;

  return (
    <>
      {showNotif && activeId && (
        <NotificationsModal disruptionId={activeId} onClose={() => setShowNotif(false)} />
      )}
      {showScenarios && activeId && (
        <ScenariosModal disruptionId={activeId} onClose={() => setShowScenarios(false)} />
      )}

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 overflow-y-auto">
        {/* Aksaklık listesi */}
        <Card title="Aktif Aksaklıklar (IRROPS)">
          {list.length === 0 && <div className="text-sm text-white/50">Aktif aksaklık yok.</div>}
          <div className="space-y-2">
            {list.map((d) => (
              <button
                key={d.id}
                onClick={() => { setChosen(d.id); setResult(null); }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  d.id === activeId ? "bg-white/10 border-white/15" : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-thy" />
                  <span className="font-semibold text-sm">{d.flight.flightNo}</span>
                  <span className="text-xs text-white/50">{d.type}</span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {d.flight.depAirport.iata} → {d.flight.arrAirport.iata} · {d.flight.arrAirport.city}
                </div>
                <div className="text-[11px] text-white/45 mt-0.5">{d.reason}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detay + öneri */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-bold">
                  {active ? `${active.flight.flightNo} — ${active.flight.arrAirport.city}` : "Aksaklık seçin"}
                </div>
                {active && <div className="text-sm text-white/55">{active.reason}</div>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeId && (
                  <>
                    <button
                      onClick={() => setShowScenarios(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition"
                    >
                      <GitCompare size={14} /> Senaryo
                    </button>
                    <button
                      onClick={() => setShowNotif(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition"
                    >
                      <Bell size={14} /> Bildirim
                    </button>
                  </>
                )}
                <button
                  onClick={runRecommend}
                  disabled={!activeId || busy}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-thy hover:bg-red-600 disabled:opacity-50 text-sm font-semibold transition"
                >
                  <Sparkles size={16} /> {busy ? "Üretiliyor…" : "Yapay Zeka Önerisi Üret"}
                </button>
              </div>
            </div>
            {recErr && <div className="mt-3 text-sm text-thy">{recErr}</div>}
          </Card>

          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Etkilenen Yolcu" value={result.affectedCount} />
                <Stat label="Alternatif Uçuş" value={result.alternativeCount} />
                <Stat label="Üretilen Öneri" value={result.passengers.length} />
              </div>
              <div className="flex items-center gap-2 text-xs text-white/55">
                <Sparkles size={13} className="text-thy" />
                Atama yöntemi: <span className="text-white/85 font-medium">{result.method}</span>
              </div>

              {/* Gelir Etkisi */}
              {result.revenueImpact && <RevenueCard r={result} />}

              {result.briefing && (
                <Card title="Operatör Brifingi">
                  <div className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                    {result.briefing}
                  </div>
                  <div className="mt-2 text-[11px] text-white/40 flex items-center gap-1">
                    <Sparkles size={11} className="text-thy" />
                    Kaynak: {result.briefingSource === "claude" ? "Claude LLM" : "şablon (anahtar yok)"}
                  </div>
                </Card>
              )}

              <Card title="Öncelik Sıralı Yeniden Yerleştirme Önerileri">
                <div className="space-y-3">
                  {result.passengers.map((p) => {
                    const best = p.options[0];
                    const CareIcon = p.care ? careIcon[p.care.type] || BadgeDollarSign : null;
                    return (
                      <div key={p.passengerId} className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="w-9 h-9 rounded-full bg-thy/20 text-thy flex items-center justify-center text-xs font-bold">
                            {p.score}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">
                              {p.fullName}{" "}
                              <span className={`text-xs ${loyaltyColor(p.loyalty)}`}>· {p.loyalty}</span>
                              <span className="text-xs text-white/45"> · {p.ticketClass}</span>
                              {p.hasConnection && <span className="text-xs text-orange-400"> · bağlantılı</span>}
                              {p.specialNeed !== "NONE" && (
                                <span className="text-xs text-cyan-400"> · {p.specialNeed}</span>
                              )}
                            </div>
                            {best ? (
                              <div className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                                <Plane size={12} className="text-thy" /> {best.rationale}
                              </div>
                            ) : (
                              <div className="text-xs text-thy mt-0.5">Uygun alternatif uçuş yok</div>
                            )}
                          </div>
                          {p.care && CareIcon && (
                            <div className="flex items-center gap-1.5 text-xs bg-black/30 rounded-lg px-2.5 py-1.5">
                              <CareIcon size={13} className="text-thy" />
                              <span className="text-white/80">{p.care.note}</span>
                              {p.care.amount > 0 && <span className="text-white/50">${p.care.amount}</span>}
                            </div>
                          )}
                          {best &&
                            (applied[p.passengerId] ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-1.5">
                                <Check size={14} /> {applied[p.passengerId]} uygulandı
                              </span>
                            ) : (
                              <button
                                onClick={() => apply(p.passengerId, best.toFlightId, best.toFlightNo)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-thy hover:bg-red-600 transition shrink-0"
                              >
                                Uygula
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          {/* Proaktif risk uyarıları */}
          {riskItems.length > 0 && (
            <Card title="Yapay Zeka Erken Uyarı — Sıradaki Yüksek Riskli Uçuşlar">
              <div className="space-y-1.5">
                {riskItems
                  .filter((f) => (f.delayProbability ?? 0) >= 0.45)
                  .slice(0, 6)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={14} className="text-thy" />
                        <span className="font-medium">{f.flightNo}</span>
                        <span className="text-white/55">· {f.route}</span>
                      </div>
                      <div className="text-xs text-white/70 flex items-center gap-3">
                        <span>~{f.expectedDelayMin} dk</span>
                        <span className="font-medium text-thy">
                          %{Math.round((f.delayProbability ?? 0) * 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                {riskItems.filter((f) => (f.delayProbability ?? 0) >= 0.45).length === 0 && (
                  <div className="text-sm text-white/55">Yüksek riskli sıradaki uçuş yok.</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-white/55 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

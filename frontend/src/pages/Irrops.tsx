import { useState } from "react";
import { AlertTriangle, Plane, Sparkles, Hotel, Utensils, RotateCcw, BadgeDollarSign, Check } from "lucide-react";
import { Card } from "../components/Card";
import { Skeleton, ErrorState } from "../components/Skeleton";
import { useApi } from "../hooks/useApi";
import { getDisruptions, recommend, applyProposal, getFlightRisk } from "../api/irrops";
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

export default function Irrops() {
  const { data: disruptions, loading, error, reload } = useApi(() => getDisruptions());
  const risk = useApi(() => getFlightRisk());
  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [recErr, setRecErr] = useState("");
  const [applied, setApplied] = useState<Record<string, string>>({}); // passengerId -> toFlightNo

  const list = disruptions || [];
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
    } catch {
      setRecErr("Uygulanamadı — backend/oturum kontrol edin.");
    }
  };

  if (loading)
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (error)
    return (
      <div className="flex-1 p-6">
        <ErrorState message="Aksaklıklar yüklenemedi. Backend (localhost:4000) çalışıyor mu?" onRetry={reload} />
      </div>
    );

  return (
    <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 overflow-y-auto">
      {/* Aksaklık listesi */}
      <Card title="Aktif Aksaklıklar (IRROPS)">
        {list.length === 0 && <div className="text-sm text-white/50">Aktif aksaklık yok.</div>}
        <div className="space-y-2">
          {list.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setChosen(d.id);
                setResult(null);
              }}
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
            <button
              onClick={runRecommend}
              disabled={!activeId || busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-thy hover:bg-red-600 disabled:opacity-50 text-sm font-semibold transition"
            >
              <Sparkles size={16} /> {busy ? "Üretiliyor…" : "Yapay Zeka Önerisi Üret"}
            </button>
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

        {/* Proaktif risk uyarıları: ML'in muhtemel gördüğü sıradaki uçuşlar */}
        {risk.data && risk.data.aiAvailable && (
          <Card title="Yapay Zeka Erken Uyarı — Sıradaki Yüksek Riskli Uçuşlar">
            <div className="space-y-1.5">
              {risk.data.items
                .filter((f) => (f.delayProbability ?? 0) >= 0.6)
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
              {risk.data.items.filter((f) => (f.delayProbability ?? 0) >= 0.6).length === 0 && (
                <div className="text-sm text-white/55">Yüksek riskli sıradaki uçuş yok.</div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
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

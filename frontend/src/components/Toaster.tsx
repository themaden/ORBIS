import { useEffect, useState } from "react";
import { AlertTriangle, Check, BrainCircuit } from "lucide-react";
import { getSocket } from "../api/socket";

interface Toast {
  id: number;
  kind: "disruption" | "apply" | "ai_alert";
  text: string;
}

let nextId = 1;

export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const s = getSocket();
    const push = (t: Omit<Toast, "id">) => {
      const id = nextId++;
      setItems((arr) => [...arr, { id, ...t }]);
      setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== id)), 6000);
    };

    const onDisruption = (d: { flightNo?: string; flight?: { flightNo?: string }; reason?: string }) =>
      push({
        kind: "disruption",
        text: `Yeni IRROPS: ${d?.flightNo ?? d?.flight?.flightNo ?? "?"} — ${d?.reason ?? ""}`,
      });

    const onApply = (a: { actor?: string }) =>
      push({ kind: "apply", text: `Öneri uygulandı (${a?.actor ?? "operatör"})` });

    const onAiAlert = (p: {
      flightNo: string;
      route: string;
      expectedDelayMin: number;
      affectedCount: number;
      careActions: { hotel: number; meal: number };
    }) => {
      const care: string[] = [];
      if (p.careActions.hotel > 0) care.push(`${p.careActions.hotel} otel`);
      if (p.careActions.meal > 0) care.push(`${p.careActions.meal} ikram`);
      push({
        kind: "ai_alert",
        text:
          `AI Uyarı: ${p.flightNo} (${p.route}) — ~${p.expectedDelayMin} dk` +
          (care.length ? ` · ${care.join(", ")} hazırlandı` : ""),
      });
    };

    s.on("disruption", onDisruption);
    s.on("apply", onApply);
    s.on("ai_alert", onAiAlert);
    return () => {
      s.off("disruption", onDisruption);
      s.off("apply", onApply);
      s.off("ai_alert", onAiAlert);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className="glass rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm shadow-xl pointer-events-auto"
        >
          {t.kind === "ai_alert" ? (
            <BrainCircuit size={16} className="text-orange-400 shrink-0" />
          ) : t.kind === "disruption" ? (
            <AlertTriangle size={16} className="text-thy shrink-0" />
          ) : (
            <Check size={16} className="text-emerald-400 shrink-0" />
          )}
          <span className="text-white/90">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

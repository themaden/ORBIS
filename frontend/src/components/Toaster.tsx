import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { getSocket } from "../api/socket";

interface Toast {
  id: number;
  kind: "disruption" | "apply";
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
      setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== id)), 5000);
    };
    const onDisruption = (d: { flight?: { flightNo?: string }; reason?: string }) =>
      push({
        kind: "disruption",
        text: `Yeni IRROPS: ${d?.flight?.flightNo ?? "?"} — ${d?.reason ?? ""}`,
      });
    const onApply = (a: { actor?: string }) =>
      push({ kind: "apply", text: `Öneri uygulandı (${a?.actor ?? "operatör"})` });
    s.on("disruption", onDisruption);
    s.on("apply", onApply);
    return () => {
      s.off("disruption", onDisruption);
      s.off("apply", onApply);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className="glass rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm shadow-xl pointer-events-auto"
        >
          {t.kind === "disruption" ? (
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

import { Card } from "../components/Card";
import { Send, Phone, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";

const channels = [
  { id: 1, name: "Operasyon Merkezi", last: "TK1985 gecikme protokolü etkin.", unread: 3, time: "şimdi" },
  { id: 2, name: "Pilot Brifing", last: "Yarınki nöbet listesi paylaşıldı.", unread: 0, time: "12 dk" },
  { id: 3, name: "Kabin Ekibi - LH", last: "Londra otel transferi onaylandı.", unread: 1, time: "1 saat" },
  { id: 4, name: "Yer Hizmetleri IST", last: "Kapı B14 boşaltıldı.", unread: 0, time: "2 saat" },
  { id: 5, name: "Acil Durum Hattı", last: "Sistem durumu: Normal.", unread: 0, time: "3 saat" },
];

const messages = [
  { from: "Op. Merkezi", text: "TK1985 için Frankfurt aktarması revize ediliyor.", me: false, time: "14:02" },
  { from: "Sen", text: "Onaylandı. Yeni kapı bilgilerini iletin.", me: true, time: "14:04" },
  { from: "Op. Merkezi", text: "Kapı A22 olarak güncellendi. Yolcular bilgilendirildi.", me: false, time: "14:06" },
  { from: "Sen", text: "Teşekkürler, mürettebat haberdar mı?", me: true, time: "14:07" },
  { from: "Op. Merkezi", text: "Evet, kaptan brifingi tamamlandı.", me: false, time: "14:08" },
];

export default function Communications() {
  const [active, setActive] = useState(1);
  const [text, setText] = useState("");
  return (
    <div className="flex-1 p-6 grid grid-cols-[280px_1fr_280px] gap-4 overflow-hidden">
      <Card title="Kanallar" className="overflow-y-auto">
        <ul className="space-y-1.5">
          {channels.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActive(c.id)}
                className={`w-full text-left p-3 rounded-xl border ${
                  active === c.id
                    ? "bg-white/10 border-white/10"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{c.name}</span>
                  {c.unread > 0 && (
                    <span className="bg-thy text-[10px] rounded-full px-1.5">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/55 truncate mt-0.5">
                  {c.last}
                </div>
                <div className="text-[10px] text-white/40 mt-1">{c.time}</div>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.me ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.me
                    ? "bg-thy text-white"
                    : "bg-white/10 text-white/90"
                }`}
              >
                {!m.me && (
                  <div className="text-[10px] text-white/60 mb-0.5">{m.from}</div>
                )}
                {m.text}
                <div className="text-[10px] opacity-60 mt-1 text-right">{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mesaj yaz..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button className="bg-thy rounded-full p-2">
            <Send size={14} />
          </button>
        </div>
      </Card>

      <Card title="Hızlı İletişim">
        <ul className="space-y-3 text-sm">
          {[
            { icon: Phone, label: "Acil Durum Hattı", v: "+90 212 444 0 849" },
            { icon: Mail, label: "Operasyon E-posta", v: "ops@thy.com" },
            { icon: MessageSquare, label: "Pilot Hattı", v: "INT-2200" },
          ].map(({ icon: Icon, label, v }) => (
            <li key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Icon size={13} className="text-thy" /> {label}
              </div>
              <div className="mt-1 font-medium">{v}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

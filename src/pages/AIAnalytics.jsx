import { Card, Stat } from "../components/Card";
import { TrendingUp, AlertTriangle, Sparkles, Cpu } from "lucide-react";

const bars = [62, 78, 55, 90, 70, 84, 95, 68, 77, 88, 73, 92];
const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

export default function AIAnalytics() {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="Tahmin Doğruluğu" value="94.2%" hint="Son 30 gün" accent="text-emerald-400" />
        <Stat label="Aktif Modeller" value="18" hint="3 yeni eğitildi" />
        <Stat label="Tespit Edilen Anomali" value="27" hint="Bugün" accent="text-thy" />
        <Stat label="Veri İşlem Hızı" value="2.4M/s" hint="Olay/saniye" accent="text-cyan-400" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Aylık Gecikme Tahminleri (saat)" className="col-span-2">
          <div className="flex items-end gap-3 h-56 px-2">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-thy to-red-400"
                  style={{ height: `${b}%`, opacity: 0.85 }}
                />
                <span className="text-[11px] text-white/50">{months[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Aktif Modeller">
          <ul className="space-y-3 text-sm">
            {[
              { name: "Hava Durumu Tahminleyici", v: "98%", icon: Cpu },
              { name: "Yolcu Yoğunluğu Modeli", v: "91%", icon: TrendingUp },
              { name: "Yakıt Optimizasyonu", v: "87%", icon: Sparkles },
              { name: "Anomali Tespiti", v: "95%", icon: AlertTriangle },
            ].map(({ name, v, icon: Icon }) => (
              <li key={name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/85">
                  <Icon size={15} className="text-thy" /> {name}
                </span>
                <span className="text-emerald-400 font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Yapay Zeka Önerileri" className="col-span-3">
          <ul className="grid grid-cols-3 gap-4 text-sm">
            {[
              "TK1985 uçuşunun rotasını Atlantik üzerinden değiştir, 18dk tasarruf.",
              "Frankfurt aktarmalarında 35 dk tampon süre ekle (kötü hava).",
              "Tokyo–IST güzergahında ek mürettebat planla (yorgunluk riski).",
            ].map((t, i) => (
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

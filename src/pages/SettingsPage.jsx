import { Card } from "../components/Card";
import { useState } from "react";
import { Bell, Globe, Moon, Shield, KeyRound } from "lucide-react";

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition relative ${
        checked ? "bg-thy" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [opts, setOpts] = useState({
    notify: true,
    dark: true,
    alerts: true,
    twofa: false,
  });
  const set = (k) => (v) => setOpts({ ...opts, [k]: v });

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
        <Card title="Profil">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-thy flex items-center justify-center text-2xl font-bold">
              AY
            </div>
            <div>
              <div className="font-semibold">Ahmet Yılmaz</div>
              <div className="text-xs text-white/60">Operasyon Yöneticisi</div>
              <div className="text-xs text-white/40 mt-1">
                maden3438@gmail.com
              </div>
            </div>
          </div>
          <button className="w-full mt-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">
            Profili Düzenle
          </button>
        </Card>

        <Card title="Tercihler" className="col-span-2">
          {[
            { k: "notify", icon: Bell, label: "Bildirimler", desc: "Tüm push bildirimleri" },
            { k: "dark", icon: Moon, label: "Koyu Mod", desc: "Komuta merkezi teması" },
            { k: "alerts", icon: Shield, label: "Kriz Uyarıları", desc: "Yüksek riskli uçuş anında uyar" },
            { k: "twofa", icon: KeyRound, label: "İki Adımlı Doğrulama", desc: "Giriş güvenliği" },
          ].map(({ k, icon: Icon, label, desc }) => (
            <div
              key={k}
              className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon size={16} className="text-thy" />
                </div>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-white/55">{desc}</div>
                </div>
              </div>
              <Toggle checked={opts[k]} onChange={set(k)} />
            </div>
          ))}
        </Card>

        <Card title="Dil ve Bölge" className="col-span-3">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Dil", value: "Türkçe", icon: Globe },
              { label: "Saat Dilimi", value: "GMT+3 (İstanbul)", icon: Globe },
              { label: "Para Birimi", value: "TRY (₺)", icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <Icon size={13} className="text-thy" /> {label}
                </div>
                <div className="mt-2 font-medium">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

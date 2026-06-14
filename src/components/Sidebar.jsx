import { useState } from "react";
import {
  Plane,
  BrainCircuit,
  Users,
  MessageSquare,
  Settings,
  Headphones,
  UserCircle2,
  Phone,
  Mail,
  LogOut,
} from "lucide-react";
import Modal from "./Modal";

const items = [
  { id: "ops", icon: Plane, label: "Gerçek Zamanlı\nOperasyonlar" },
  { id: "ai", icon: BrainCircuit, label: "Yapay Zeka Analizleri" },
  { id: "resources", icon: Users, label: "Kaynak Yönetimi" },
  { id: "comms", icon: MessageSquare, label: "İletişim Merkezi" },
  { id: "settings", icon: Settings, label: "Ayarlar" },
];

export default function Sidebar({ page, setPage }) {
  const [modal, setModal] = useState(null); // "support" | "profile" | null

  return (
    <aside className="w-[260px] h-full glass flex flex-col p-5 z-10">
      <div className="flex items-center gap-3 mb-8 px-1">
        <svg viewBox="0 0 64 64" className="w-10 h-10">
          <circle cx="32" cy="32" r="30" fill="#E30A17" />
          <path
            d="M44 32c0 8-6 14-14 14-3 0-6-1-8-3 4 1 9 0 12-3 4-3 5-8 4-12-1-3-4-6-7-7 3-1 6-1 9 0 2 1 4 3 4 6v5z"
            fill="#fff"
          />
        </svg>
        <div className="leading-tight">
          <div className="font-bold text-[15px] tracking-wide">TURKISH</div>
          <div className="font-bold text-[15px] tracking-wide -mt-0.5">
            AIRLINES
          </div>
        </div>
      </div>

      {/* product name */}
      <div className="mb-7 px-1">
        <div className="text-[18px] font-extrabold tracking-tight">
          Aero<span className="text-thy">Nexus</span>
        </div>
        <div className="text-[10px] text-white/45 tracking-[0.2em] uppercase">
          Komuta Platformu
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {items.map(({ id, icon: Icon, label }) => {
          const active = id === page;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                active
                  ? "bg-white/10 border border-white/10"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon size={18} className="text-white/90 shrink-0" />
              <span className="text-[13.5px] text-white/90 whitespace-pre-line leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
        <button
          onClick={() => setModal("support")}
          className="flex items-center gap-3 text-white/80 text-sm hover:text-white transition"
        >
          <Headphones size={18} />
          <span>Destek</span>
        </button>
        <button
          onClick={() => setModal("profile")}
          className="flex items-center gap-3 text-white/80 text-sm hover:text-white transition"
        >
          <UserCircle2 size={20} />
          <div className="leading-tight text-left">
            <div className="text-[13.5px] font-medium">Profilim</div>
            <div className="text-[11px] text-white/50">
              Passenger: Ahmet Yılmaz
            </div>
          </div>
        </button>
      </div>

      {/* Destek modal */}
      <Modal
        open={modal === "support"}
        onClose={() => setModal(null)}
        title="Destek Merkezi"
      >
        <p className="text-sm text-white/70 mb-4">
          7/24 operasyon destek hattımıza ulaşın.
        </p>
        <ul className="space-y-2.5">
          {[
            { icon: Phone, label: "Acil Operasyon Hattı", v: "+90 212 444 0 849" },
            { icon: Mail, label: "Destek E-posta", v: "destek@thy.com" },
            { icon: MessageSquare, label: "Canlı Sohbet", v: "INT-2200 dahili" },
          ].map(({ icon: Icon, label, v }) => (
            <li
              key={label}
              className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon size={16} className="text-thy" />
              </div>
              <div>
                <div className="text-xs text-white/55">{label}</div>
                <div className="text-sm font-medium">{v}</div>
              </div>
            </li>
          ))}
        </ul>
      </Modal>

      {/* Profil modal */}
      <Modal
        open={modal === "profile"}
        onClose={() => setModal(null)}
        title="Profilim"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-thy flex items-center justify-center text-2xl font-bold">
            AY
          </div>
          <div>
            <div className="font-semibold text-lg">Ahmet Yılmaz</div>
            <div className="text-xs text-white/60">Operasyon Yöneticisi</div>
            <div className="text-xs text-white/40 mt-0.5">maden3438@gmail.com</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-white/55">Sicil No</div>
            <div className="font-medium">THY-04821</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-white/55">Üs</div>
            <div className="font-medium">İstanbul (IST)</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-white/55">Yetki</div>
            <div className="font-medium">Tam Erişim</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-white/55">Vardiya</div>
            <div className="font-medium">Gündüz</div>
          </div>
        </div>
        <button className="w-full py-2.5 rounded-xl bg-thy hover:bg-red-600 transition text-sm font-medium flex items-center justify-center gap-2">
          <LogOut size={15} /> Oturumu Kapat
        </button>
      </Modal>
    </aside>
  );
}

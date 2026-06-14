import { useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import {
  Headphones,
  Phone,
  Mail,
  MessageSquare,
  LogOut,
  Lock,
  User,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Modal from "./Modal";
import Logo from "./Logo";
import { NAV } from "../nav";

type ModalKind = "support" | "login" | null;

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [user, setUser] = useState("Ahmet Yılmaz");
  const [sicil, setSicil] = useState("THY-04821");
  const [pw, setPw] = useState("");

  const initials = user
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!sicil.trim()) return;
    setModal(null);
    setPw("");
  };

  const supportItems: { icon: LucideIcon; label: string; v: string }[] = [
    { icon: Phone, label: "Acil Operasyon Hattı", v: "+90 212 444 0 849" },
    { icon: Mail, label: "Destek E-posta", v: "destek@thy.com" },
    { icon: MessageSquare, label: "Canlı Sohbet", v: "INT-2200 dahili" },
  ];

  return (
    <aside
      style={{ left: open ? "0px" : "-260px" }}
      className="w-[260px] h-full glass flex flex-col p-5 z-40 shrink-0
        fixed top-0 bottom-0 lg:static lg:left-auto"
    >
      <div className="flex items-center gap-3 mb-8 px-1">
        <Logo />
        <div className="leading-tight">
          <div className="font-bold text-[15px] tracking-wide">TURKISH</div>
          <div className="font-bold text-[15px] tracking-wide -mt-0.5">
            AIRLINES
          </div>
        </div>
      </div>

      {/* product name */}
      <div className="mb-7 px-1">
        <div className="text-[20px] font-extrabold tracking-[0.15em]">
          ORB<span className="text-thy">IS</span>
        </div>
        <div className="text-[10px] text-white/45 tracking-[0.2em] uppercase">
          Global Komuta Platformu
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {NAV.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                isActive
                  ? "bg-white/10 border border-white/10"
                  : "hover:bg-white/5 border border-transparent"
              }`
            }
          >
            <Icon size={18} className="text-white/90 shrink-0" />
            <span className="text-[13.5px] text-white/90 whitespace-pre-line leading-tight">
              {label}
            </span>
          </NavLink>
        ))}
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
          onClick={() => setModal("login")}
          className="flex items-center gap-3 text-white/80 text-sm hover:text-white transition"
        >
          <span className="w-7 h-7 rounded-full bg-thy flex items-center justify-center text-[11px] font-bold shrink-0">
            {initials}
          </span>
          <div className="leading-tight text-left">
            <div className="text-[13.5px] font-medium">Profilim</div>
            <div className="text-[11px] text-white/50">Passenger: {user}</div>
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
          {supportItems.map(({ icon: Icon, label, v }) => (
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

      {/* Personel Giriş modal */}
      <Modal open={modal === "login"} onClose={() => setModal(null)}>
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="w-14 h-14 mb-3" />
          <div className="text-lg font-bold tracking-[0.15em]">
            ORB<span className="text-thy">IS</span>
          </div>
          <div className="text-xs text-white/50">Personel Girişi</div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="text-xs text-white/55 mb-1 block">Ad Soyad</label>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-thy transition">
              <User size={15} className="text-white/50" />
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1"
                placeholder="Ad Soyad"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/55 mb-1 block">Sicil No</label>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-thy transition">
              <ShieldCheck size={15} className="text-white/50" />
              <input
                value={sicil}
                onChange={(e) => setSicil(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1"
                placeholder="THY-00000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/55 mb-1 block">Şifre</label>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-thy transition">
              <Lock size={15} className="text-white/50" />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-thy hover:bg-red-600 transition text-sm font-semibold mt-2"
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setModal(null)}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-white/60 flex items-center justify-center gap-2"
          >
            <LogOut size={13} /> Oturumu Kapat
          </button>
        </form>
      </Modal>
    </aside>
  );
}

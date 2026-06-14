import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Headphones,
  Phone,
  Mail,
  MessageSquare,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import Modal from "./Modal";
import Logo from "./Logo";
import { NAV } from "../nav";
import { useAuth } from "../auth/AuthContext";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const [supportOpen, setSupportOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.name ?? "Misafir";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/giris", { replace: true });
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
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-3 text-white/80 text-sm hover:text-white transition"
        >
          <Headphones size={18} />
          <span>Destek</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-thy flex items-center justify-center text-[11px] font-bold shrink-0">
            {initials}
          </span>
          <div className="leading-tight text-left min-w-0 flex-1">
            <div className="text-[13.5px] font-medium truncate">{name}</div>
            <div className="text-[11px] text-white/50">
              {user?.sicil ?? "Operasyon"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Oturumu kapat"
            title="Oturumu kapat"
            className="text-white/50 hover:text-thy transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Destek modal */}
      <Modal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
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
    </aside>
  );
}

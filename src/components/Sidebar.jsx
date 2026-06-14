import {
  Plane,
  BrainCircuit,
  Users,
  MessageSquare,
  Settings,
  Headphones,
  UserCircle2,
} from "lucide-react";

const items = [
  { id: "ops", icon: Plane, label: "Gerçek Zamanlı\nOperasyonlar" },
  { id: "ai", icon: BrainCircuit, label: "Yapay Zeka Analizleri" },
  { id: "resources", icon: Users, label: "Kaynak Yönetimi" },
  { id: "comms", icon: MessageSquare, label: "İletişim Merkezi" },
  { id: "settings", icon: Settings, label: "Ayarlar" },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="w-[260px] h-full glass flex flex-col p-5 z-10">
      <div className="flex items-center gap-3 mb-10 px-1">
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
        <button className="flex items-center gap-3 text-white/80 text-sm">
          <Headphones size={18} />
          <span>Destek</span>
        </button>
        <button className="flex items-center gap-3 text-white/80 text-sm">
          <UserCircle2 size={20} />
          <div className="leading-tight text-left">
            <div className="text-[13.5px] font-medium">Profilim</div>
            <div className="text-[11px] text-white/50">
              Passenger: Ahmet Yılmaz
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}

import { useState } from "react";
import {
  Hash,
  Volume2,
  Plus,
  Search,
  Bell,
  Pin,
  Users as UsersIcon,
  Send,
  Gift,
  Smile,
  PlusCircle,
  Mic,
  Headphones,
  Settings as Cog,
} from "lucide-react";

const categories = [
  {
    name: "OPERASYON",
    channels: [
      { id: "genel", name: "genel", type: "text" },
      { id: "anlik-durum", name: "anlık-durum", type: "text", unread: true },
      { id: "kriz-masasi", name: "kriz-masası", type: "text", badge: 3 },
      { id: "duyurular", name: "duyurular", type: "text" },
    ],
  },
  {
    name: "EKİPLER",
    channels: [
      { id: "pilotlar", name: "pilotlar", type: "text" },
      { id: "kabin", name: "kabin-ekibi", type: "text" },
      { id: "yer-hizmet", name: "yer-hizmetleri", type: "text" },
    ],
  },
  {
    name: "SESLİ KANALLAR",
    channels: [
      { id: "kule", name: "Kule Hattı", type: "voice", count: 4 },
      { id: "brifing", name: "Brifing Odası", type: "voice", count: 0 },
    ],
  },
];

const roleColor = {
  Komuta: "#E30A17",
  Pilot: "#f0b429",
  Kabin: "#38bdf8",
  Yer: "#34d399",
};

const messagesByChannel = {
  "anlik-durum": [
    { user: "Op. Merkezi", role: "Komuta", time: "14:02", text: "TK1985 için Frankfurt aktarması revize ediliyor. Tüm birimler hazır olsun." },
    { user: "Mehmet Demir", role: "Pilot", time: "14:04", text: "Anlaşıldı, yeni kapı bilgisini bekliyoruz." },
    { user: "Op. Merkezi", role: "Komuta", time: "14:06", text: "Kapı A22 olarak güncellendi. Yolcular bilgilendirildi ✅" },
    { user: "Zeynep Kaya", role: "Kabin", time: "14:07", text: "Kabin ekibi brifinge hazır. Catering yüklemesi tamam." },
    { user: "Ali Yıldız", role: "Yer", time: "14:08", text: "A22 kapısı boşaltıldı, körük bağlandı." },
    { user: "Op. Merkezi", role: "Komuta", time: "14:09", text: "Harika. Kalkış slotu 14:35 olarak onaylandı." },
  ],
  genel: [
    { user: "Zeynep Kaya", role: "Kabin", time: "13:40", text: "Günaydın ekip! Bugün yoğun bir gün olacak gibi 🛫" },
    { user: "Mehmet Demir", role: "Pilot", time: "13:42", text: "Günaydın, hava raporları ellerine ulaştı mı?" },
    { user: "Op. Merkezi", role: "Komuta", time: "13:45", text: "Evet, Avrupa rotasında fırtına bekleniyor. Detaylar #kriz-masası kanalında." },
  ],
  "kriz-masasi": [
    { user: "Op. Merkezi", role: "Komuta", time: "12:10", text: "⚠️ Londra üzerinde gelen fırtına nedeniyle 50 otel odası ön rezervasyonu yapıldı." },
    { user: "Ali Yıldız", role: "Yer", time: "12:14", text: "Transfer araçları da ayarlandı, 6 adet hazır." },
  ],
};

function Avatar({ name, role }) {
  const init = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: (roleColor[role] || "#555") + "33", color: roleColor[role] || "#ddd" }}
    >
      {init}
    </div>
  );
}

const members = [
  { name: "Op. Merkezi", role: "Komuta", status: "online" },
  { name: "Mehmet Demir", role: "Pilot", status: "online" },
  { name: "Selin Arslan", role: "Pilot", status: "online" },
  { name: "Zeynep Kaya", role: "Kabin", status: "online" },
  { name: "Ali Yıldız", role: "Yer", status: "idle" },
  { name: "Burak Şahin", role: "Yer", status: "offline" },
  { name: "Elif Çetin", role: "Kabin", status: "offline" },
];

const statusColor = { online: "#34d399", idle: "#f0b429", offline: "#6b7280" };

export default function Communications() {
  const [active, setActive] = useState("anlik-durum");
  const [text, setText] = useState("");

  const activeName =
    categories.flatMap((c) => c.channels).find((c) => c.id === active)?.name ||
    "genel";
  const msgs = messagesByChannel[active] || [];
  const online = members.filter((m) => m.status !== "offline");
  const offline = members.filter((m) => m.status === "offline");

  return (
    <div className="flex-1 px-6 pb-6 overflow-hidden">
      <div className="h-full glass rounded-2xl overflow-hidden flex">
        {/* Channels column */}
        <div className="w-[230px] bg-black/25 flex flex-col border-r border-white/5">
          <div className="px-4 h-14 flex items-center justify-between border-b border-white/5 shadow">
            <span className="font-semibold text-sm">ORBIS Komuta</span>
            <Bell size={15} className="text-white/50" />
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-white/40 flex items-center justify-between">
                  {cat.name}
                  <Plus size={12} className="cursor-pointer hover:text-white" />
                </div>
                {cat.channels.map((ch) => {
                  const sel = ch.id === active;
                  const Icon = ch.type === "voice" ? Volume2 : Hash;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => ch.type === "text" && setActive(ch.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
                        sel
                          ? "bg-white/10 text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <Icon size={16} className="shrink-0 opacity-70" />
                      <span className={`truncate ${ch.unread && !sel ? "text-white font-medium" : ""}`}>
                        {ch.name}
                      </span>
                      {ch.badge && (
                        <span className="ml-auto bg-thy text-[10px] rounded-full px-1.5 leading-tight py-0.5">
                          {ch.badge}
                        </span>
                      )}
                      {ch.type === "voice" && ch.count > 0 && (
                        <span className="ml-auto text-[10px] text-white/40">
                          {ch.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {/* user bar */}
          <div className="h-14 bg-black/40 px-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-thy flex items-center justify-center text-[11px] font-bold">
              AY
            </div>
            <div className="leading-tight flex-1 min-w-0">
              <div className="text-xs font-medium truncate">Ahmet Yılmaz</div>
              <div className="text-[10px] text-emerald-400">çevrimiçi</div>
            </div>
            <Mic size={15} className="text-white/50" />
            <Headphones size={15} className="text-white/50" />
            <Cog size={15} className="text-white/50" />
          </div>
        </div>

        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 px-4 flex items-center gap-3 border-b border-white/5">
            <Hash size={18} className="text-white/40" />
            <span className="font-semibold text-sm">{activeName}</span>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <span className="text-xs text-white/45 truncate">
              Operasyon ekibi gerçek zamanlı koordinasyon kanalı
            </span>
            <div className="ml-auto flex items-center gap-3 text-white/45">
              <Pin size={16} className="hover:text-white cursor-pointer" />
              <UsersIcon size={16} className="hover:text-white cursor-pointer" />
              <div className="flex items-center gap-1.5 bg-black/30 rounded px-2 py-1">
                <Search size={13} />
                <input
                  placeholder="Ara"
                  className="bg-transparent outline-none text-xs w-20"
                />
              </div>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <div className="text-center">
              <div className="inline-flex w-14 h-14 rounded-full bg-thy/20 items-center justify-center mb-2">
                <Hash size={26} className="text-thy" />
              </div>
              <div className="font-bold">#{activeName} kanalına hoş geldin</div>
              <div className="text-xs text-white/45">
                Bu kanalın en başı. Mesajlar gerçek zamanlı görüntülenir.
              </div>
            </div>
            {msgs.map((m, i) => (
              <div key={i} className="flex gap-3 hover:bg-white/[0.03] -mx-2 px-2 py-1 rounded-lg">
                <Avatar name={m.user} role={m.role} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: roleColor[m.role] }}
                    >
                      {m.user}
                    </span>
                    <span className="text-[10px] text-white/35">{m.time}</span>
                  </div>
                  <div className="text-sm text-white/85 leading-relaxed">
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <PlusCircle size={20} className="text-white/45" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`#${activeName} kanalına mesaj gönder`}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <Gift size={18} className="text-white/45" />
              <Smile size={18} className="text-white/45" />
              <button className="bg-thy rounded-lg p-1.5">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Members column */}
        <div className="w-[210px] bg-black/25 border-l border-white/5 overflow-y-auto p-3">
          <div className="text-[10px] font-semibold tracking-wider text-white/40 px-2 mb-2">
            ÇEVRİMİÇİ — {online.length}
          </div>
          {online.map((m) => (
            <MemberRow key={m.name} m={m} />
          ))}
          <div className="text-[10px] font-semibold tracking-wider text-white/40 px-2 mb-2 mt-4">
            ÇEVRİMDIŞI — {offline.length}
          </div>
          {offline.map((m) => (
            <MemberRow key={m.name} m={m} dim />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ m, dim }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 ${
        dim ? "opacity-45" : ""
      }`}
    >
      <div className="relative">
        <Avatar name={m.name} role={m.role} />
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0e0e12]"
          style={{ background: statusColor[m.status] }}
        />
      </div>
      <div className="min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{ color: roleColor[m.role] }}
        >
          {m.name}
        </div>
        <div className="text-[10px] text-white/40">{m.role}</div>
      </div>
    </div>
  );
}

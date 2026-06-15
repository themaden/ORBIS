// Merkezi demo verisi. Backend hazır olduğunda bu dosyanın yerini gerçek
// API yanıtları alacak; bileşenler yalnızca api/client.ts üzerinden veriye erişir.
import type {
  Crisis,
  FleetItem,
  StatItem,
  ResourceUsageItem,
  Analytics,
  CommsSeed,
} from "../types";

export const crisis: Crisis = {
  riskIndex: 75,
  delays: [
    { region: "Avrupa", level: "Yüksek", extraHours: 2.5 },
    { region: "Asya", level: "Orta", extraHours: 1 },
  ],
  suggestions: [
    "Yaklaşan fırtına nedeniyle Londra'da 50 otel odasını önceden ayırın.",
    "Hava sistemini aşmak için uçuşları Orta Avrupa üzerinden yeniden yönlendirin.",
  ],
};

export const fleet: FleetItem[] = [
  { code: "TC-JJP", model: "Boeing 777-300ER", status: "Uçuşta", route: "IST → JFK", progress: 64 },
  { code: "TC-LJA", model: "Airbus A350-900", status: "Uçuşta", route: "IST → NRT", progress: 32 },
  { code: "TC-JNR", model: "Boeing 737 MAX", status: "Bakımda", route: "IST Hangar 3", progress: 0 },
  { code: "TC-LGB", model: "Airbus A321neo", status: "Kapıda", route: "IST → LHR", progress: 0 },
  { code: "TC-JOH", model: "Boeing 787-9", status: "Uçuşta", route: "IST → GRU", progress: 78 },
];

export const resourceStats: StatItem[] = [
  { label: "Aktif Uçak", value: "386", hint: "Filodaki toplam", accent: "text-white" },
  { label: "Görevdeki Mürettebat", value: "1,248", hint: "Pilot + Kabin", accent: "text-cyan-400" },
  { label: "Boş Otel Odası", value: "412", hint: "Tüm üsler", accent: "text-emerald-400" },
  { label: "Bakımda", value: "14", hint: "3 acil", accent: "text-thy" },
];

export const resourceUsage: ResourceUsageItem[] = [
  { label: "Uçak kullanımı", v: 82, icon: "Plane" },
  { label: "Mürettebat", v: 76, icon: "Users" },
  { label: "Otel kontenjanı", v: 58, icon: "Hotel" },
  { label: "Bakım kapasitesi", v: 91, icon: "Wrench" },
];

export const analytics: Analytics = {
  stats: [
    { label: "Tahmin Doğruluğu", value: "94.2%", hint: "Son 30 gün", accent: "text-emerald-400" },
    { label: "Aktif Modeller", value: "18", hint: "3 yeni eğitildi", accent: "text-white" },
    { label: "Tespit Edilen Anomali", value: "27", hint: "Bugün", accent: "text-thy" },
    { label: "Veri İşlem Hızı", value: "2.4M/s", hint: "Olay/saniye", accent: "text-cyan-400" },
  ],
  bars: [62, 78, 55, 90, 70, 84, 95, 68, 77, 88, 73, 92],
  months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  models: [
    { name: "Hava Durumu Tahminleyici", v: "98%", icon: "Cpu" },
    { name: "Yolcu Yoğunluğu Modeli", v: "91%", icon: "TrendingUp" },
    { name: "Yakıt Optimizasyonu", v: "87%", icon: "Sparkles" },
    { name: "Anomali Tespiti", v: "95%", icon: "AlertTriangle" },
  ],
  suggestions: [
    "TK1985 uçuşunun rotasını Atlantik üzerinden değiştir, 18dk tasarruf.",
    "Frankfurt aktarmalarında 35 dk tampon süre ekle (kötü hava).",
    "Tokyo–IST güzergahında ek mürettebat planla (yorgunluk riski).",
  ],
};

export const comms: CommsSeed = {
  categories: [
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
  ],
  members: [
    { name: "Op. Merkezi", role: "Komuta", status: "online" },
    { name: "Mehmet Demir", role: "Pilot", status: "online" },
    { name: "Selin Arslan", role: "Pilot", status: "online" },
    { name: "Zeynep Kaya", role: "Kabin", status: "online" },
    { name: "Ali Yıldız", role: "Yer", status: "idle" },
    { name: "Burak Şahin", role: "Yer", status: "offline" },
    { name: "Elif Çetin", role: "Kabin", status: "offline" },
  ],
  messagesByChannel: {
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
  },
};

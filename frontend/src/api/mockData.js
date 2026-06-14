// Merkezi demo verisi. Backend hazır olduğunda bu dosyanın yerini gerçek
// API yanıtları alacak; bileşenler yalnızca api/client.js üzerinden veriye erişir.

export const crisis = {
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

export const fleet = [
  { code: "TC-JJP", model: "Boeing 777-300ER", status: "Uçuşta", route: "IST → JFK", progress: 64 },
  { code: "TC-LJA", model: "Airbus A350-900", status: "Uçuşta", route: "IST → NRT", progress: 32 },
  { code: "TC-JNR", model: "Boeing 737 MAX", status: "Bakımda", route: "IST Hangar 3", progress: 0 },
  { code: "TC-LGB", model: "Airbus A321neo", status: "Kapıda", route: "IST → LHR", progress: 0 },
  { code: "TC-JOH", model: "Boeing 787-9", status: "Uçuşta", route: "IST → GRU", progress: 78 },
];

export const resourceStats = [
  { label: "Aktif Uçak", value: "386", hint: "Filodaki toplam", accent: "text-white" },
  { label: "Görevdeki Mürettebat", value: "1,248", hint: "Pilot + Kabin", accent: "text-cyan-400" },
  { label: "Boş Otel Odası", value: "412", hint: "Tüm üsler", accent: "text-emerald-400" },
  { label: "Bakımda", value: "14", hint: "3 acil", accent: "text-thy" },
];

export const resourceUsage = [
  { label: "Uçak kullanımı", v: 82, icon: "Plane" },
  { label: "Mürettebat", v: 76, icon: "Users" },
  { label: "Otel kontenjanı", v: 58, icon: "Hotel" },
  { label: "Bakım kapasitesi", v: 91, icon: "Wrench" },
];

export const analytics = {
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

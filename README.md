<div align="center">

# 🛫 ORBIS — Global Komuta Platformu

**Turkish Airlines için yapay zeka destekli global operasyon komuta merkezi**

Dönen 3B dünya küresi · Kriz tahmincisi · Kaynak yönetimi · Discord tarzı iletişim merkezi

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)

</div>

---

## 📋 Hakkında

ORBIS, bir havayolu operasyon merkezini simüle eden modern bir **front-end** gösterge panelidir.
Gerçek zamanlı uçuş takibi, yapay zeka kriz tahmini ve ekip koordinasyonunu tek bir koyu
temalı arayüzde birleştirir. Tüm veriler demo amaçlı statik (mock) verilerdir.

## ✨ Özellikler

- **🌍 3B Dünya Küresi** — `d3-geo` orthographic projeksiyonla gerçek dönen küre. Otomatik
  döner, fareyle sürüklenebilir; ~190 ülke başkenti ve flightradar tarzı minik uçaklarla.
  Rotalar great-circle (büyük daire) yayları olarak çizilir, yalnız görünen yarıkürede.
- **🧠 Yapay Zeka Kriz Tahmincisi** — %75 Aksaklık Risk Endeksi göstergesi (SVG gauge),
  tahmini gecikmeler ve yapay zeka önerileri.
- **📊 Yapay Zeka Analizleri** — tahmin doğruluğu, aktif modeller, aylık gecikme grafiği.
- **🛩️ Kaynak Yönetimi** — filo durumu tablosu, mürettebat ve kaynak tahsis çubukları.
- **💬 İletişim Merkezi** — Discord tarzı arayüz: kategorili kanallar, rol renkli mesajlar,
  çevrimiçi/çevrimdışı üye listesi, gerçek zamanlı mesaj gönderme.
- **⚙️ Ayarlar** — localStorage'a kaydedilen tercihler.
- **🔎 Canlı arama** — uçuş / yolcu / kaynak için filtreli öneri listesi.
- **📱 Responsive & erişilebilir** — breakpoint'ler, klavye (Esc), `aria` etiketleri.

## 🛠️ Teknolojiler

| Katman | Araç |
|--------|------|
| Çatı | React 19 + Vite 8 |
| Stil | Tailwind CSS 3 (glassmorphism, koyu kırmızı tema) |
| Harita | d3-geo + topojson-client (world-atlas) |
| İkonlar | lucide-react |

## 🚀 Kurulum

```bash
# Depoyu klonla
git clone https://github.com/themaden/ORBIS.git
cd ORBIS/frontend

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu (http://localhost:5173)
npm run dev

# Üretim derlemesi
npm run build

# Derlemeyi önizle
npm run preview
```

> **Not:** Tüm uygulama `frontend/` klasörü altındadır.

## 📂 Proje Yapısı

```
frontend/
├── public/
│   └── favicon.svg          # THY kaz logosu
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx       # Sol menü + giriş/destek modalları
│   │   ├── TopBar.jsx        # Başlık + arama + canlı saat
│   │   ├── WorldMap.jsx      # 3B dünya küresi
│   │   ├── RightPanel.jsx    # Kriz tahmincisi paneli
│   │   ├── Modal.jsx         # Portal tabanlı modal
│   │   ├── Card.jsx          # Kart / istatistik bileşenleri
│   │   └── Logo.jsx          # Turkish Airlines logosu
│   ├── pages/
│   │   ├── Operations.jsx
│   │   ├── AIAnalytics.jsx
│   │   ├── Resources.jsx
│   │   ├── Communications.jsx
│   │   └── SettingsPage.jsx
│   ├── App.jsx               # Sayfa yönlendirme
│   ├── index.css             # Tailwind + tema
│   └── main.jsx
├── index.html
└── package.json
```

## 🗺️ Yol Haritası

- [ ] Küre render'ını canvas'a taşıyarak performans optimizasyonu
- [ ] Gerçek uçuş verisi API entegrasyonu
- [ ] Uçakların rotalar boyunca animasyonlu hareketi
- [ ] Çoklu dil desteği (i18n)

## 📄 Lisans

Bu proje eğitim/demo amaçlıdır. Turkish Airlines markası ve logosu ilgili sahibine aittir.

---

<div align="center">
Turkish Airlines · ORBIS
</div>

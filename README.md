<div align="center">

# 🛫 ORBIS — IRROPS Karar Destek Sistemi

**Turkish Airlines için yapay zeka destekli global operasyon komuta merkezi**

3B dünya küresi · Kriz tahmincisi · IRROPS yeniden yerleştirme · OR-Tools optimizasyon · ML risk tahmini · Discord tarzı iletişim

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node_+_Express-339933?logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-Postgres-2D3748?logo=prisma&logoColor=white)
![FastAPI](https://img.shields.io/badge/AI-Python_+_FastAPI-009688?logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?logo=scikit-learn&logoColor=white)
![OR-Tools](https://img.shields.io/badge/Optimization-OR--Tools-4285F4?logo=google&logoColor=white)

</div>

---

## 📋 İçindekiler

1. [Problem](#problem)
2. [Mimari](#mimari)
3. [Frontend (React + TS)](#frontend)
4. [Backend (Express + Prisma)](#backend)
5. [AI servisi (FastAPI + ML)](#ai)
6. [Veritabanı](#veritabanı)
7. [Veri akışı uçtan uca](#veri-akışı)
8. [Kurulum & Çalıştırma](#kurulum)
9. [API uç noktaları](#api)
10. [Yol haritası](#yol)

---

## 🎯 Problem <a name="problem"></a>

**IRROPS** (Irregular Operations) — hava durumu, ekip planlama veya teknik
arıza nedeniyle uçuş akışının bozulması. Bu durumlarda **bağlantılı yolcuların
yönetimi**, **alternatif uçuşlara dağıtım** ve **passenger care** (otel,
ikram, transfer, iade) operasyonları **manuel** ve **yavaş** yürüyor.

**Challenge:** IRROPS sürecini hızlandıracak, veri destekli + kural bazlı
öneriler sunan ve operatöre **gerekçesiyle** sunduğu kararları tek tıkla
uygulatan bir **karar destek sistemi**.

**Paydaşlar:** IOCC · Hub Kontrol · Passenger Care · Yer Hizmetleri · Çağrı Merkezi.

---

## 🏗️ Mimari <a name="mimari"></a>

Monorepo — üç bağımsız servis, kendi klasörlerinde:

```
ORBIS/
├── frontend/   → React 19 + Vite + Tailwind (gösterge paneli)
├── backend/    → Node.js + Express + Prisma (API + WebSocket)
├── ai/         → Python + FastAPI + scikit-learn + OR-Tools
└── docs/       → PLAN.md (mimari detayı)
```

### Veri akışı (tam zincir)

```
┌──────────────┐    REST + WS    ┌──────────────┐    REST    ┌──────────────┐
│   Frontend   │ ◄────────────► │   Backend    │ ◄────────► │   AI Servisi │
│ React + TS   │    JSON         │ Express + JS │   JSON     │   FastAPI    │
│   :5173      │                 │    :4000     │            │    :8000     │
└──────────────┘                 └──────┬───────┘            └──────────────┘
                                        │ Prisma
                                        ▼
                                 ┌──────────────┐
                                 │  PostgreSQL  │
                                 │    :5432     │
                                 └──────────────┘
```

| Servis | Sorumluluk |
|--------|-----------|
| **Frontend** | Kullanıcı arayüzü, IRROPS akışı, küre, gauge, toast |
| **Backend** | DB erişimi, auth, öneri motoru orkestrasyonu, AI proxy, WebSocket |
| **AI** | Risk skoru (açıklanabilir), gecikme tahmini (RandomForest), optimal atama (OR-Tools), brifing (LLM) |

---

## 🎨 Frontend <a name="frontend"></a>

**Stack:** React 19 · TypeScript (strict) · Vite 8 · Tailwind 3 · React Router 7 · Framer Motion · Recharts · d3-geo · socket.io-client · Vitest

### Yapı

```
frontend/src/
├── api/
│   ├── http.ts          # Backend HTTP istemci (JWT token önbellek)
│   ├── socket.ts        # WebSocket istemci (tek örnek)
│   ├── client.ts        # Mock veri fallback'i
│   ├── irrops.ts        # IRROPS uç tipleri ve çağrıları
│   └── mockData.ts      # Demo verisi (backend kapalıyken)
├── auth/
│   └── AuthContext.tsx  # JWT + localStorage oturumu
├── components/
│   ├── Sidebar.tsx      # Navigasyon + giriş/destek modalları
│   ├── TopBar.tsx       # Başlık + canlı saat + arama
│   ├── WorldMap.tsx     # 3B dönen küre (canvas + d3-geo)
│   ├── RightPanel.tsx   # Kriz tahmincisi + gauge (WS canlı)
│   ├── LiveFlights.tsx  # Canlı uçuş tablosu + ML risk renklendirme
│   ├── Toaster.tsx      # WS olayları → sağ-alt toast
│   ├── Modal.tsx        # Portal-based, focus-trap, Esc
│   ├── ErrorBoundary.tsx
│   ├── Skeleton.tsx     # Yükleme + hata durumları
│   ├── Card.tsx · Logo.tsx · RequireAuth.tsx
├── hooks/
│   └── useApi.ts        # { data, loading, error, reload }
├── lib/
│   └── gauge.ts         # Yarım daire SVG geometrisi (saf, test edilebilir)
├── pages/
│   ├── Login.tsx        # Personel girişi
│   ├── Operations.tsx   # Küre + canlı uçuş tablosu + kriz paneli
│   ├── Irrops.tsx       # IRROPS yönetim sayfası
│   ├── AIAnalytics.tsx  # ML metrikleri + grafik + öneriler
│   ├── Resources.tsx    # Filo durumu + kaynak kullanımı
│   ├── Communications.tsx  # Discord tarzı sohbet
│   └── SettingsPage.tsx # Tercihler (localStorage)
├── test/                # Vitest + Testing Library (13 test)
├── App.tsx              # Router + Layout + lazy + ErrorBoundary
├── main.tsx
├── nav.ts               # Tek navigasyon kaynağı
├── theme.ts             # Koyu/açık tema
└── types.ts             # Tip merkezi
```

### Sayfa sayfa ne yapıldı

#### 🌍 `/` Operasyon Merkezi
- **3B dönen dünya küresi** (`d3-geo` orthographic, `<canvas>` üzerine imperatif çizim, performans kritik)
- **~190 ülke başkenti** mavi pin (hover'da ad)
- **Flightradar tarzı sarı uçaklar** (rastgele konum/yön, görünen yarıkürede)
- **İstanbul hub** beyaz uçak + kırmızı halo + atmosfer parıltısı
- **Büyük-daire (great-circle) rotalar** kırmızı arc (sadece görünen yarıkürede)
- **Sürükleyerek elle çevirme** + otomatik dönüş
- **Canlı uçuş tablosu** (alt şerit): backend'den uçuşlar + ML gecikme olasılığı
  - ≥%70 olasılık → kırmızı ⚠ ikon + kırmızı renk
- **Sağ panel — Yapay Zeka Kriz Tahmincisi:**
  - 75% gauge (SVG, gerçek risk endeksinden)
  - WebSocket "kpi" olayıyla **canlı güncellenir** (~5sn)
  - "Canlı · WebSocket · 14:32:18" damgası
  - Tahmini gecikmeler (bölge bazlı) + AI önerileri

#### 🚨 `/irrops` IRROPS Yönetimi
- **Aktif aksaklıklar listesi** (sol panel)
- Seçince **detay + "Yapay Zeka Önerisi Üret"** butonu
- Üretildiğinde:
  - **İstatistik kartları:** etkilenen yolcu, alternatif uçuş, üretilen öneri
  - **Atama yöntemi** etiketi: "optimal (min-cost flow)" veya "greedy (heuristik)"
  - **Operatör Brifingi** kartı (LLM veya şablon — kaynağı belirtir)
  - **Öncelik sıralı yolcu kartları:**
    - Skor rozeti (0-100)
    - Yolcu profili (Elite Plus / Business / bağlantılı / özel ihtiyaç)
    - Önerilen uçuş + ek dakika + gerekçe (Türkçe doğal dil)
    - **ML risk uyarısı:** "⚠ tahmini gecikme riski ~143 dk"
    - **Care aksiyonu** (otel/ikram/transfer/iade) + tahmini maliyet
    - **"Uygula"** butonu → DB'de booking taşınır, audit log yazılır
    - Uygulandı → ✅ "TK1916 uygulandı" rozeti
- **Yapay Zeka Erken Uyarı** kartı: ML'in henüz aksamamış ama yüksek riskli (≥%60) gördüğü uçuşlar (proaktif tahmin)
- **WebSocket otomatik yenileme:** başka birinin oluşturduğu disruption / yaptığı apply anında görünür

#### 🧠 `/analiz` Yapay Zeka Analizleri
- **İstatistik kartları:** Tahmin doğruluğu, aktif modeller, anomali, veri işlem hızı
- **Aylık gecikme bar grafiği** (Recharts, gerçek tooltip + eksen)
- **Aktif modeller** listesi
- **🆕 ML Model — Gerçek Holdout Metrikleri:**
  - **MAE (dk):** 17.4
  - **RMSE (dk):** 22.8
  - **AUC:** 0.935
  - **Eğitim/Test:** 4500 / 1500
  - **Özellik önemi çubukları** (hava %77.8 baskın, doluluk %9.7, saat %6.3, menzil %6.2)
  - Model: "RandomForest (regresyon + sınıflandırma)"
- **Yapay zeka önerileri** (statik mock — operasyonel insight örnekleri)

#### 💬 `/iletisim` İletişim Merkezi
Discord arayüzü birebir taklit:
- **Kategorili kanallar:** OPERASYON (#genel, #anlık-durum, #kriz-masası, #duyurular), EKİPLER, SESLİ KANALLAR
- **Rol renkli mesajlar:** Komuta kırmızı, Pilot sarı, Kabin mavi, Yer yeşil
- **Avatar baş harfleri** (rolüne göre renk)
- **Üye listesi:** çevrimiçi/çevrimdışı, durum noktaları
- **Mesaj gönderme** (Enter veya butonla)
- Alt kullanıcı çubuğu (mikrofon/kulaklık/ayar)

#### 🛩️ `/kaynaklar` Kaynak Yönetimi
- Filodaki uçaklar tablosu (durumla renklendirme)
- Kaynak tahsisi çubukları (uçak %82, mürettebat %76 …)
- 4'lü istatistik kartı (aktif uçak, mürettebat, otel odası, bakım)

#### ⚙️ `/ayarlar` Ayarlar
- **Profil:** AY avatarı, isim, rol
- **Tercihler:** Bildirimler, **Koyu Mod** (gerçekten çalışıyor → light tema), Kriz Uyarıları, 2FA
  - Tüm seçimler `localStorage`'a kaydedilir, sayfa yenilenince hatırlar
- **Dil/Bölge** (TR / GMT+3 / TRY)

### Erişilebilirlik & UX
- **Modal:** `role="dialog"`, Esc ile kapatma, **focus-trap** (Tab modal'da kalır)
- **ikon-only butonlarda** `aria-label`
- **Toggle'larda** `role="switch"` + `aria-checked`
- **Mobil responsive:**
  - Sidebar < 1024px'te **hamburger drawer**
  - Operations sayfası `flex-col` → mobil'de küre üst, panel alt
  - TopBar `flex-wrap`
- **Animasyonlar:** Framer Motion ile sayfa geçişleri (fade + slide)
- **Skeleton yükleme** + **ErrorBoundary** (uygulama çökmesin)
- **Code-split:** `React.lazy` ile her sayfa ayrı bundle parçası

### Test & CI
- **Vitest + Testing Library:** 13 test
  - Gauge geometrisi (saf fonksiyon)
  - useApi hook (loading/data/error)
  - TopBar arama
  - Communications mesaj gönderme
  - Sidebar nav + auth
- **GitHub Actions CI:** lint + test + build her push'ta
- **TypeScript strict:** tsc 0 hata
- **ESLint:** 0 hata

### Doğrudan kullanılan paketler
| Paket | Niyet |
|-------|-------|
| `react-router-dom` | URL'ler, geri/ileri, deep-link, korumalı route |
| `framer-motion` | Sayfa geçiş animasyonları |
| `recharts` | Bar grafik (AI Analizleri) |
| `lucide-react` | İkonlar |
| `d3-geo` + `topojson-client` | Küre projeksiyonu + dünya verisi |
| `socket.io-client` | WebSocket bağlantısı |

---

## ⚙️ Backend <a name="backend"></a>

**Stack:** Node.js · Express 4 · Prisma 5 · PostgreSQL 16 · JWT · bcryptjs · Socket.IO · express-async-errors

### Yapı

```
backend/
├── docker-compose.yml      # PostgreSQL 16
├── prisma/
│   ├── schema.prisma       # IRROPS veri modeli (11 tablo)
│   ├── migrations/         # init migration
│   └── seed.mjs            # Demo veri (12 havalimanı, 22 uçuş, 140 yolcu, 1 IRROPS)
├── src/
│   ├── index.js            # Express + WebSocket sunucusu
│   ├── db.js               # Prisma singleton (hot-reload'a dayanıklı)
│   ├── middleware/
│   │   └── auth.js         # JWT signToken + requireAuth
│   ├── routes/
│   │   ├── index.js        # Tüm router'ları birleştirir
│   │   ├── auth.js         # POST /api/auth/login
│   │   ├── flights.js      # GET /api/flights, /api/flights/:id
│   │   ├── disruptions.js  # IRROPS CRUD + recommend + apply
│   │   ├── kpi.js          # /api/kpi/summary (AI risk skoru)
│   │   ├── model.js        # /api/model/info (AI proxy)
│   │   └── risk.js         # /api/risk/flights (proaktif ML)
│   └── services/
│       ├── aiClient.js     # AI servisi istemci (fallback'li)
│       ├── kpiService.js   # KPI hesaplama (REST + WS paylaşır)
│       ├── recommend.js    # IRROPS öneri motoru (skor + atama + care)
│       └── briefing.js     # LLM operatör brifingi (Anthropic + fallback)
└── package.json
```

### Yetenekler (ne yapıyor?)

1. **JWT kimlik doğrulama** — `POST /api/auth/login` → token; korumalı uçlar
2. **Uçuş yönetimi** — listele/detay (Prisma include'larla rota+yolcu+uçak)
3. **IRROPS olayları** — CRUD (oluşturunca uçuşu CANCELLED işaretler)
4. **Etkilenen yolcu hesabı** — iptal uçuştan yolcu listesi + bağlantılı segment tespiti
5. **🌟 Öneri motoru** (`services/recommend.js`):
   - Yolcu öncelik skoru (sadakat + sınıf + bağlantı + özel ihtiyaç ağırlıklı)
   - Aday alternatif uçuş bulma (varış aynı, MCT, kapasite)
   - AI optimal atama (`POST /assign`) — kapalıysa **greedy fallback**
   - **ML risk-ayarlı maliyet:** her uçuşun ML gecikme riskini atama maliyetine ekler
   - Care aksiyonu (>6sa otel, 2-6sa ikram, alternatif yok → iade)
   - Şeffaf gerekçe (Türkçe doğal dil)
6. **Uygula akışı** (`POST /api/disruptions/:id/apply`):
   - PNR'yi yeni uçuşa taşır (Prisma transaction)
   - Yeni uçuşta koltuk dolar
   - Diğer öneriler REJECTED, ilgili APPLIED
   - Care aksiyonu APPROVED
   - Audit log yazılır
7. **KPI / Risk endeksi** — AI servisinden besler, fallback'i var
8. **Proaktif risk** (`/api/risk/flights`) — sıradaki uçuşlar için batch ML tahmini
9. **LLM brifingi** — Anthropic Claude API ile doğal dil özet (key yoksa şablon)
10. **WebSocket (Socket.IO):**
    - Bağlanmada anlık KPI gönder
    - Her 5sn KPI yayını ("kpi" event)
    - Yeni disruption → "disruption" event
    - Apply → "apply" event
11. **Sağlamlık:**
    - `express-async-errors` + error middleware (DB kapalıyken çökmez, 503 döner)
    - CORS, JSON body parser
    - Prisma singleton (hot-reload'da çoğalmaz)

### Önemli mimari kararlar

| Karar | Neden |
|-------|-------|
| Express, NestJS değil | Daha az boilerplate, daha hızlı geliştirme |
| Plain JS, TS değil | (Eksiklik, yol haritasında) — frontend TS'le tip paylaşımı yok |
| Prisma, raw SQL değil | Tip güvenli sorgular, otomatik migration |
| WebSocket + REST | REST kararsal, WS canlı bildirim |
| AI proxy pattern | Frontend AI'yı doğrudan bilmez → CORS basit, anahtar gizli |

---

## 🧠 AI Servisi <a name="ai"></a>

**Stack:** Python 3.14 · FastAPI · Pydantic 2 · Uvicorn · **scikit-learn 1.9** (RandomForest) · **OR-Tools 9** (min-cost flow) · NumPy 2

### Yapı

```
ai/
├── requirements.txt        # fastapi, uvicorn, pydantic, ortools, scikit-learn, numpy
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI uygulama + uç noktalar
│   ├── schemas.py          # Pydantic modelleri (tip güvenli sözleşmeler)
│   ├── model.py            # Risk skoru (ağırlıklı lojistik) + delay (ML wrapper)
│   ├── ml.py               # RandomForest eğitim + holdout metrik
│   └── assign.py           # OR-Tools min-cost flow optimal atama
└── .env.example
```

### Üç sütun

#### 1. Risk Skoru (`/risk/score`) — açıklanabilir

**Ağırlıklı lojistik model.** Beş girdiyi (iptal oranı, gecikme oranı,
doluluk, hava şiddeti, hub yoğunluğu) ağırlıklarla birleştirir, sigmoid'le
0-100'e sıkıştırır.

**Çıktı:**
```json
{
  "riskIndex": 62,
  "level": "Orta",
  "factors": [
    {"name": "Hava şiddeti", "contribution": 28},
    {"name": "Doluluk", "contribution": 17},
    ...
  ],
  "suggestions": ["..."],
  "source": "orbis-ai"
}
```

**Neden basit lojistik?** Şeffaflık. Jüri "neden bu skor?" sorusuna her
faktörün katkısını gösterebiliriz. Black-box değil.

#### 2. Gecikme Tahmini (`/predict/delay` ve `/batch`) — gerçek ML

**RandomForest** (sklearn) regresyon + sınıflandırma, **train/test split** ile.

**Eğitim:**
- Sentetik veri (etkileşimli + heteroskedastik gürültü)
- 6000 örnek, 75/25 split
- 4 özellik: `departureHour`, `loadFactor`, `routeHaulHours`, `weatherSeverity`
- Regresyon: dakika cinsinden gecikme tahmini
- Sınıflandırma: "önemli gecikme (>30dk)" olasılığı

**Dürüst holdout metrikleri** (`/model/info` ucundan görünür):
- **MAE:** 17.4 dk
- **RMSE:** 22.8 dk
- **AUC:** 0.935
- **Feature importance:** hava 0.78 (baskın), doluluk 0.10, saat 0.06, menzil 0.06

⚠ **Sentetik veri uyarısı:** Demo amaçlı, gerçek THY verisiyle değiştirilebilir
(arayüz aynı kalır). Yol haritasında Kaggle BTS veri seti hedeflendi.

#### 3. Optimal Atama (`/assign`) — OR-Tools

**Min-cost flow** ile yolcu→uçuş ataması. Kapasite kısıtı altında toplam
maliyeti minimize eder.

**Mekanizma:**
- Düğümler: kaynak → yolcular → (uçuş, sınıf) → hedef
- Kenar maliyeti: `delay * (1 + priority/50)` — yüksek öncelikli yolcunun gecikme maliyeti ağırlaştırılır
- "Atanamama" kenarı: 100000 + priority*100 (dummy düğüm) — yüksek öncelikli atanmamak çok pahalı

**Sonuç:** Öncelik 90'lık yolcu **garantili** düşük gecikmeli uçuşu alır.

### `/health` çıktısı
```json
{
  "status": "ok",
  "service": "orbis-ai",
  "risk": "weighted-logistic",
  "assign": "min-cost-flow",
  "delayModel": "random-forest (MAE=17.4 dk, AUC=0.935)"
}
```

### Tasarım kararları

| Karar | Neden |
|-------|-------|
| Python (Node değil) | sklearn + OR-Tools ekosistemi |
| FastAPI (Flask değil) | Async + Pydantic + otomatik /docs |
| Sentetik veri | Gerçek THY verisi yok; mimari hazır |
| Holdout test | Train metriği yanıltıcı; dürüst değerlendirme |
| RandomForest | Hızlı eğitim, tabular için güçlü, açıklanabilir (feature_importances_) |
| OR-Tools min-cost flow | Yüksek öncelik garantili; greedy'den üstün |

---

## 🗄️ Veritabanı <a name="veritabanı"></a>

**PostgreSQL 16** (Docker) + **Prisma 5** ORM.

### 11 tablo

| Tablo | Açıklama |
|-------|----------|
| `airports` | IATA, şehir, lat/lon, MCT (minimum bağlantı süresi) |
| `aircraft` | Kuyruk no, model, sınıf bazlı koltuk sayısı |
| `flights` | Planlı/tahmini saatler, durum, kapasite, doluluk |
| `passengers` | Bilet sınıfı, sadakat, özel ihtiyaç |
| `bookings` (PNR) | Yolcu↔uçuş, koltuk, bağlantı segment, ACT |
| `disruptions` | IRROPS olayı (tip, sebep, başlangıç) |
| `rebooking_proposals` | disruption↔yolcu↔alt uçuş, skor, rank, durum |
| `care_actions` | otel/ikram/transfer/iade önerileri |
| `cost_params` | Skor ağırlıkları + birim maliyetler |
| `audit_log` | Kim, ne, ne zaman yaptı |
| `users` | Personel (rol bazlı) |

### Demo seed
12 havalimanı (IST hub) · 22 uçuş · 140 yolcu (35% bağlantılı) · 1 IRROPS
olayı (TK1900, hava nedenli iptal) · 1 demo kullanıcı (`ahmet` / `orbis123`).

---

## 🔄 Veri akışı uçtan uca <a name="veri-akışı"></a>

### Senaryo: Operatör IRROPS aksaklığı çözüyor

```
1. Frontend → Backend
   GET /api/disruptions
   → Backend → DB → liste döner

2. Operatör "Yapay Zeka Önerisi Üret" tıklar
   Frontend → Backend
   POST /api/disruptions/:id/recommend (JWT)

3. Backend:
   ├─ Etkilenen yolcuları DB'den çeker
   ├─ Öncelik skoru hesaplar (kural bazlı)
   ├─ Aday alternatif uçuşları bulur (varış + MCT + kapasite)
   ├─ AI'ya POST /predict/delay/batch → her uçuşun ML risk tahmini
   ├─ AI'ya POST /assign → OR-Tools optimal atama (risk-ayarlı)
   ├─ Care aksiyonları (kural eşiği)
   ├─ AI'ya brifing isteği → LLM doğal dil özeti (veya şablon)
   ├─ DB'ye yazar (rebooking_proposals + care_actions)
   └─ Sonucu frontend'e döndürür

4. Frontend:
   ├─ Operatör Brifingi kartı (LLM çıktısı)
   ├─ Öncelik sıralı yolcu kartları (skor + gerekçe + ML uyarısı)
   └─ "Uygula" butonları aktif

5. Operatör birine "Uygula" tıklar
   Frontend → Backend
   POST /api/disruptions/:id/apply (JWT) { passengerId, toFlightId }

6. Backend transaction:
   ├─ booking.flightId güncellenir (yolcu yeni uçuşta)
   ├─ Yeni uçuşta economyBooked++ (kapasite düşer)
   ├─ rebooking_proposal.status = APPLIED (seçilen)
   ├─ Diğer öneriler = REJECTED
   ├─ care_action.status = APPROVED
   ├─ audit_log: "Ahmet Yılmaz · proposal.apply"
   └─ WebSocket "apply" event yayınlar

7. Tüm bağlı istemciler:
   ├─ Toaster sağ-altta: "✓ Öneri uygulandı (Ahmet Yılmaz)"
   ├─ LiveFlights tablosu otomatik yenilenir (kapasite değişti)
   └─ IRROPS sayfasında risk skorları yeniden hesaplanır
```

### Paralel: Gauge canlı güncelleme

```
Her 5sn backend:
  computeKpi() → AI /risk/score → KPI hesapla → io.emit("kpi", data)

Frontend RightPanel:
  socket.on("kpi") → setLive(...) → gauge SVG animasyonla güncellenir
  → "Canlı · WebSocket · 14:32:18" damgası
```

---

## 🚀 Kurulum & Çalıştırma <a name="kurulum"></a>

### Gereksinimler
- Node.js 20+
- Python 3.11+ (3.14 test edildi)
- Docker Desktop (PostgreSQL için)

### Adım adım

```bash
# 1) Repository
git clone https://github.com/themaden/ORBIS.git
cd ORBIS

# 2) Frontend
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:4000
npm run dev                # → http://localhost:5173

# 3) Backend + DB (yeni terminal)
cd backend
npm install
cp .env.example .env       # DATABASE_URL, JWT_SECRET ayarla
npm run db:up              # PostgreSQL 16 (Docker)
npm run prisma:migrate     # Tablolar
npm run seed               # Demo veri
npm run dev                # → http://localhost:4000

# 4) AI servisi (yeni terminal)
cd ai
python -m venv .venv
.venv\Scripts\activate     # Windows  (Unix: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --port 8000   # → http://localhost:8000/docs
```

### Demo girişi
- **Kullanıcı adı:** `ahmet`
- **Şifre:** `orbis123`

### Opsiyonel API key'ler
- `ANTHROPIC_API_KEY` — LLM brifing (yoksa şablon fallback)
- `WEATHER_API_KEY` — hava verisi (henüz entegre değil)

---

## 🔌 API uç noktaları <a name="api"></a>

### Backend (`:4000`)
| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/health` | Sağlık kontrolü |
| POST | `/api/auth/login` | JWT giriş |
| GET | `/api/flights[?status=]` | Uçuş listesi |
| GET | `/api/flights/:id` | Uçuş detayı |
| GET | `/api/disruptions` | IRROPS olayları |
| POST | `/api/disruptions` 🔒 | Yeni olay |
| GET | `/api/disruptions/:id/passengers` | Etkilenen yolcular |
| POST | `/api/disruptions/:id/recommend` 🔒 | Öneri üret |
| POST | `/api/disruptions/:id/apply` 🔒 | Öneriyi uygula |
| GET | `/api/disruptions/:id/proposals` | Kayıtlı öneriler |
| GET | `/api/kpi/summary` | Risk + istatistik |
| GET | `/api/model/info` | ML metrikleri (AI proxy) |
| GET | `/api/risk/flights` | Proaktif ML risk |

🔒 = JWT gerekir

### WebSocket olayları (`socket.io`)
| Olay | Yön | İçerik |
|------|-----|--------|
| `kpi` | Server → Client | Her 5sn KPI + risk |
| `disruption` | Server → Client | Yeni IRROPS |
| `apply` | Server → Client | Öneri uygulandı |

### AI servisi (`:8000`)
| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/health` | Sağlık + model bilgisi |
| GET | `/model/info` | Holdout metrikleri + feature importance |
| POST | `/risk/score` | IRROPS risk endeksi |
| POST | `/predict/delay` | Tek uçuş gecikme tahmini |
| POST | `/predict/delay/batch` | Toplu tahmin |
| POST | `/assign` | OR-Tools optimal atama |
| GET | `/docs` | Otomatik OpenAPI |

---

## 🗺️ Yol haritası <a name="yol"></a>

### ✅ Tamamlanan
- [x] Frontend (TypeScript, Router, Tema, IRROPS, küre, gauge, toast, lazy, test+CI)
- [x] Backend Express + Prisma + PostgreSQL (auth, IRROPS CRUD, KPI)
- [x] IRROPS öneri motoru (kural bazlı skor + kapasite-duyarlı atama + care)
- [x] AI risk servisi (FastAPI) — açıklanabilir faktör dağılımı
- [x] OR-Tools optimal atama (min-cost flow)
- [x] scikit-learn RandomForest gecikme tahmini + holdout metrik
- [x] ML kararı etkiliyor (atama maliyetine bağlandı)
- [x] Proaktif risk uyarısı (henüz aksamamış uçuşlar)
- [x] LLM operatör brifingi (Anthropic + fallback)
- [x] WebSocket canlı KPI + disruption + apply push
- [x] Frontend canlı uçuş tablosu (ML risk renklendirme)
- [x] Otomatik yenileme (WS olaylarıyla)

### ⏳ Opsiyonel (bilinçli ertelenen)
- [ ] **Gerçek veri seti** (Kaggle BTS / OpenSky) — sentetik yerine
- [ ] **Hava durumu API** entegrasyonu (`WEATHER_API_KEY`) — risk skorunu beslesin
- [ ] **Backend TypeScript'e geçiş** + Zod validation + RBAC
- [ ] **OpenAPI/Swagger** backend dokümanı
- [ ] **Backend testleri** (Vitest + supertest)
- [ ] **i18n** (TR/EN) — Ayarlar'daki "Dil" seçimini etkinleştir
- [ ] **Bulut deploy** (Vercel + Railway/Fly + managed Postgres)
- [ ] **Gerçek ML feature engineering** (havayolu, havalimanı, weekday, distance)

---

## 📄 Lisans

Eğitim / yarışma / demo amaçlıdır. Turkish Airlines markası, logosu ve görsel
referansları ilgili sahibine aittir.

---

<div align="center">

**ORBIS** · IRROPS Karar Destek Sistemi · Turkish Airlines case'i için
geliştirildi

🛫 *Made with React, Express, FastAPI, scikit-learn, OR-Tools and ❤*

</div>

# ORBIS — IRROPS Karar Destek Sistemi · Geliştirme Planı

## 1. Problem (Turkish Airlines IRROPS Case)

**IRROPS** (Irregular Operations): hava durumu, ekip planlama veya teknik arıza
nedeniyle uçuş akışının bozulması → gecikme, iptal, kapasite değişimi, bağlantılı
yolcuların etkilenmesi.

> **Challenge:** IRROPS sürecinde yolcu dağıtımı (re-accommodation), transfer
> yönetimi ve passenger care operasyonlarını daha hızlı ve verimli yönetmek için,
> **veri destekli + kural bazlı öneriler** sunan bir **karar destek sistemi**.

**Paydaşlar:** Yolcular · Passenger Care Center · Hub Kontrol · IOCC (Integrated
Operations Control Center) · Çağrı Merkezi · Gelir Yönetimi · Yer Hizmetleri.

**Karar kriterleri (case'ten):**
- Kapasiteye göre hangi alternatif uçuşa aktarma
- Bilet sınıfı, sadakat statüsü, bağlantı durumu, özel hizmet ihtiyaçları
- Minimum bağlantı süresi (MCT), Actual Connection Time (ACT), risk skoru
- Bekleme süresine göre ikram / otel / transfer / ücret iadesi
- Operasyonel maliyet, gelir kaybı, kapasite optimizasyonu, memnuniyet
- Hub yoğunluğu, gate uygunluğu, transfer sürdürülebilirliği

---

## 2. Sistem Akışı

Bir uçuş aksadığında:
1. Etkilenen yolcuları tespit et (bağlantı kaçıranlar dahil).
2. Her yolcu için uygun alternatif uçuşları bul (kapasite + MCT).
3. Her yolcuya öncelik skoru ver (sadakat, sınıf, bağlantı riski, özel ihtiyaç).
4. Yolcuları alternatif uçuşlara optimum dağıt (kapasite kısıtlı atama).
5. Bekleme süresine göre care aksiyonu öner (ikram/otel/transfer/iade).
6. Operatöre sıralı, **gerekçeli** öneri sun → onayla/uygula.
7. Maliyet / gelir kaybı / memnuniyet etkisini göster.

---

## 3. Mimari

```
Frontend (ORBIS / React+TS) ──REST──▶ Backend (NestJS) ──REST──▶ AI (FastAPI)
        ▲   │ WebSocket canlı           │ Prisma                   │ OR-Tools / sklearn
        └───┘                       PostgreSQL ◀────────────────────┘
   :5173                              :4000 / :5432                  :8000
```

| Servis | Teknoloji | Port |
|--------|-----------|------|
| frontend | React 19, Vite, Tailwind, TS | 5173 |
| backend | NestJS, Prisma, Socket.IO, JWT | 4000 |
| ai | Python, FastAPI, OR-Tools, scikit-learn | 8000 |
| db | PostgreSQL | 5432 |

---

## 4. Veritabanı (PostgreSQL + Prisma)

| Tablo | Açıklama |
|-------|----------|
| `airports` | IATA kodu, şehir, lat/lon, hub mu, MCT |
| `aircraft` | kuyruk no, model, sınıf bazlı koltuk düzeni |
| `flights` | uçuş no, kalkış/varış, planlı/tahmini saat, durum, kapasite, doluluk |
| `passengers` | ad, bilet sınıfı (Y/C/J), Miles&Smiles statüsü, özel ihtiyaç |
| `bookings` (PNR) | yolcu↔uçuş segment'leri, koltuk, ACT |
| `disruptions` | etkilenen uçuş, tip (hava/teknik/ekip), başlangıç, etki |
| `rebooking_proposals` | disruption↔yolcu↔alternatif uçuş, skor, durum |
| `care_actions` | yolcu↔aksiyon (otel/ikram/transfer/iade), tutar, durum |
| `capacity_snapshots` | alternatif uçuşlarda sınıf bazlı boş koltuk |
| `cost_params` | otel/ikram/transfer birim maliyet, gelir kaybı katsayıları |
| `audit_log` | kim, hangi öneriyi, ne zaman onayladı |

+ Gerçekçi **seed**: 1 hub (IST), ~20 uçuş, ~500 yolcu, 1–2 disruption senaryosu.

---

## 5. Backend (NestJS)

| Modül | Endpoint | İş |
|------|----------|----|
| Auth | `POST /auth/login` | JWT |
| Flights | `GET /flights`, `GET /flights/:id` | uçuş durumları |
| Disruptions | `GET /disruptions`, `POST /disruptions` | IRROPS olayı oluştur/listele |
| Impact | `GET /disruptions/:id/passengers` | etkilenen yolcular |
| Rebooking | `POST /disruptions/:id/recommend` | AI'ı çağırır, öneri seti döner |
| | `POST /proposals/:id/apply` | öneriyi uygula (koltuk düş, PNR güncelle) |
| Care | `GET/POST /care-actions` | otel/ikram/transfer/iade |
| KPI | `GET /kpi/summary` | risk endeksi, gecikme, maliyet, memnuniyet |
| Realtime | `WS /live` | canlı akış (Socket.IO) |

Servisler: `RebookingService`, `CapacityService`, `CostService`, `AuditService`.
Çapraz: validation (Zod/class-validator), hata yönetimi, rol bazlı yetki
(IOCC / Passenger Care / Hub Control).

---

## 6. AI / Karar Motoru (FastAPI) — *işin kalbi*

**Hibrit: kural bazlı + optimizasyon.**

**A) Yolcu Öncelik Skoru (0–100, şeffaf/ağırlıklı)**
- Sadakat (Elite Plus > Elite > Classic)
- Bilet sınıfı (Business > Economy)
- Bağlantı riski (ACT < MCT → yüksek öncelik)
- Özel ihtiyaç (UM, WCHR, tıbbi)
- Nihai varışa kalan toplam gecikme
- Ağırlıklar config'ten ayarlanır → "neden bu öneri?" açıklanabilir.

**B) Alternatif Uçuş Atama (OR-Tools)**
- Uygun alternatifler: yakın destinasyon + MCT + boş koltuk.
- Kapasite kısıtlı min-cost atama → yolcular ↔ koltuklar.
- Amaç: ağırlıklı (gecikme + maliyet − memnuniyet) minimize.
- Çıktı: yolcu başına 1 en iyi + 2 alternatif, **gerekçeyle**.

**C) Care Aksiyon Önerisi (kural eşiği)**
- >6 sa → otel; 2–6 sa → ikram; gece → otel+transfer; alternatif yok → iade.

**D) Risk Endeksi / Tahmin**
- Başlangıç: hava + doluluk + gecikme sezgiseli (gauge'ı besler).
- Sonra: scikit-learn ile gecikme/iptal olasılığı.

**Endpoint:** `POST /recommend`, `POST /care/suggest`, `POST /risk/score`, `GET /health`.

---

## 7. Frontend (mevcut ORBIS'e ekleme)
- **Operasyonlar:** küre + canlı uçuş durum tablosu (kırmızı = aksayan).
- **Aksaklık (IRROPS) [yeni]:** disruption seç → etkilenen yolcular → "Öneri Üret"
  → AI öneri kartları (skor + gerekçe + Onayla).
- **Passenger Care [yeni]:** otel/ikram/transfer/iade kuyruğu.
- **Yapay Zeka Analizleri:** risk endeksi, dağıtım & maliyet/memnuniyet KPI (Recharts).
- **Kaynak Yönetimi:** alternatif uçuş kapasitesi, otel kontenjanı.

---

## 8. Gerekli API / Anahtarlar

> **Çekirdek sistem hiçbir ücretli dış API gerektirmez** — kendi DB + kendi AI motoruyla çalışır.

**Zorunlu (kendin üretirsin, dış servis değil):**
- `DATABASE_URL` — PostgreSQL (Docker/yerel)
- `JWT_SECRET` — rastgele üretilen anahtar

**Opsiyonel (sadece zenginleştirme; yoksa fallback çalışır):**
- `WEATHER_API_KEY` — OpenWeatherMap (ücretsiz) → risk endeksini gerçek hava verisiyle besler
- `ANTHROPIC_API_KEY` — Claude API → öneri gerekçelerini doğal dille yazar
- (İleride) Twilio/SendGrid → yolcuya SMS/e-posta bildirimi

Her servisin `.env.example` dosyası repoda mevcuttur.

---

## 9. Geliştirme Sırası

1. **DB şeması + seed** (Prisma) — gerçekçi demo verisi.
2. **Backend iskeleti** — `/flights`, `/disruptions`, `/disruptions/:id/passengers` (DB'den).
3. **AI `/recommend`** — kural bazlı skor + basit eşleştirme (OR-Tools'suz ilk sürüm).
4. **Backend ↔ AI bağla** — `/recommend` uçtan uca.
5. **Frontend IRROPS sayfası** — öneri üret/onayla akışı.
6. **OR-Tools optimizasyonu** + care aksiyonları.
7. **WebSocket canlı akış** + KPI gauge gerçek veriden.
8. **ML risk modeli** + deploy (Vercel + Railway/Fly + managed Postgres).

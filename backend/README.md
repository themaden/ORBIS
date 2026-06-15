# 🔌 ORBIS Backend

Node.js + Express + **Prisma (PostgreSQL)** REST API. IRROPS karar destek
sisteminin veri/ağ geçidi katmanı; kriz tahmini için **AI servisine** (FastAPI)
vekillik eder.

> Durum: ✅ DB'den çalışan API (uçuşlar, IRROPS olayları, etkilenen yolcular,
> KPI, JWT giriş). Öneri motoru (AI) entegrasyonu sıradaki adım.

## Kurulum

```bash
cd backend
npm install
cp .env.example .env            # DATABASE_URL, JWT_SECRET ayarla

# 1) PostgreSQL (Docker Desktop açık olmalı)
npm run db:up                   # postgres:16 ayağa kalkar
npm run prisma:migrate          # tabloları oluşturur (init)
npm run seed                    # demo veri (ahmet / orbis123)

# 2) Sunucu
npm run dev                     # http://localhost:4000
```

Yardımcı: `npm run prisma:studio` (veriyi tarayıcıda gör), `npm run db:reset`.

## Uç Noktalar

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/health` | Sağlık kontrolü |
| POST | `/api/auth/login` | JWT giriş (`{username, password}`) |
| GET | `/api/flights` | Uçuşlar (`?status=CANCELLED` filtreli) |
| GET | `/api/flights/:id` | Uçuş detayı + yolcular |
| GET | `/api/disruptions` | IRROPS olayları |
| POST | `/api/disruptions` | Yeni olay (uçuşu iptal işaretler) · 🔒 |
| GET | `/api/disruptions/:id/passengers` | Etkilenen yolcular |
| GET | `/api/kpi/summary` | Risk endeksi + özet istatistikler |

🔒 = `Authorization: Bearer <token>` ister.

## Yapı

```
backend/
├── docker-compose.yml         # PostgreSQL 16
├── prisma/
│   ├── schema.prisma          # IRROPS veri modeli
│   └── seed.mjs               # demo veri
├── src/
│   ├── index.js               # Express girişi + hata yakalama
│   ├── db.js                  # Prisma singleton
│   ├── middleware/auth.js     # JWT imzala/doğrula
│   ├── routes/                # auth, flights, disruptions, kpi
│   └── services/aiClient.js   # AI servisi istemcisi (+ fallback)
└── .env.example
```

## Yapılacaklar

- [ ] `POST /api/disruptions/:id/recommend` — AI öneri motoru entegrasyonu
- [ ] Care aksiyonları (otel/ikram/transfer/iade) uç noktaları
- [ ] WebSocket ile canlı veri yayını
- [ ] Rol bazlı yetkilendirme (IOCC / Passenger Care / Hub Control)

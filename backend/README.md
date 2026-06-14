# 🔌 ORBIS Backend

Node.js + Express REST API. Frontend'e uçuş/filo/kaynak verisi sağlar ve kriz
tahmini için **AI servisine** (FastAPI) vekillik eder.

> Durum: 🚧 İskelet. Veriler şimdilik `src/data/mock.js` içindeki demo verisidir.

## Kurulum

```bash
cd backend
npm install
cp .env.example .env   # değerleri düzenleyin
npm run dev            # http://localhost:4000
```

## Uç Noktalar

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/health` | Sağlık kontrolü |
| GET | `/api/flights` | Aktif uçuşlar |
| GET | `/api/fleet` | Filo durumu |
| GET | `/api/resources` | Kaynak özetleri (uçak, mürettebat, otel) |
| GET | `/api/crisis` | Kriz tahmini (AI servisinden; kapalıysa yerel fallback) |

## Yapı

```
backend/
├── src/
│   ├── index.js            # Express sunucu girişi
│   ├── routes/index.js     # API uç noktaları
│   ├── services/aiClient.js# AI servisi istemcisi (+ fallback)
│   └── data/mock.js        # Geçici demo verisi
├── .env.example
└── package.json
```

## Yapılacaklar

- [ ] Gerçek veritabanı (PostgreSQL/Prisma) entegrasyonu
- [ ] Kimlik doğrulama (JWT) ve korumalı uç noktalar
- [ ] WebSocket ile canlı veri yayını
- [ ] AI servisi sözleşmesinin (şema) netleştirilmesi

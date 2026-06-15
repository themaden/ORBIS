# 🧠 ORBIS — AI Servisi (IRROPS Risk & Gecikme)

> **Durum:** ✅ Çalışır. Şeffaf, ağırlıklı lojistik model (saf Python) — her
> faktörün katkısı açıklanabilir döner. İleride scikit-learn ile eğitilmiş
> modelle değiştirilebilir.

"Aksaklık Risk Endeksi"ni ve gecikme tahminini üreten servis. **backend**
`/api/kpi/summary` içinde bu servisin `POST /risk/score` ucunu çağırır
(servis kapalıysa yerel fallback devreye girer).

## 🛠️ Teknoloji
Python 3.11+ · FastAPI · Pydantic · Uvicorn (ML için ileride scikit-learn)

## 🚀 Kurulum

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/docs
```

## 🔌 Uç Noktalar

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/health` | Sağlık kontrolü |
| POST | `/risk/score` | IRROPS risk endeksi (0-100) + faktör dağılımı + öneri |
| POST | `/predict/delay` | Uçuş gecikme olasılığı + beklenen dakika |

### `POST /risk/score`
İstek: `{ totalFlights, cancelled, delayed, avgLoadFactor, weatherSeverity, hubCongestion }`
Yanıt: `{ riskIndex, level, factors:[{name,contribution}], suggestions, source }`

## 📂 Yapı

```
ai/
├── app/
│   ├── main.py        # FastAPI + uç noktalar
│   ├── schemas.py     # Pydantic modelleri
│   └── model.py       # risk & gecikme mantığı (şeffaf/açıklanabilir)
├── requirements.txt
└── .env.example
```

## ✅ Yapılacaklar
- [ ] Gerçek ML modeli (scikit-learn) — geçmiş veriden gecikme tahmini
- [ ] Yolcu öneri motorunu (şu an backend'de) buraya taşıma opsiyonu
- [ ] Hava durumu API entegrasyonu (`WEATHER_API_KEY`)

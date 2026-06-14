# 🧠 ORBIS — AI Servisi (Kriz Tahmini)

> **Durum:** 🚧 İskelet. Şimdilik sezgisel (heuristic) bir yer tutucu model çalışır;
> ileride gerçek bir ML modeli (scikit-learn / PyTorch) ile değiştirilecek.

"Aksaklık Risk Endeksi"ni, bölgesel gecikme tahminlerini ve operasyonel önerileri
üreten yapay zeka servisidir. **backend** bu servisi `POST /predict` ile çağırır.

## 🛠️ Seçilen Teknoloji

| Konu | Tercih | Neden |
|------|--------|-------|
| Dil | **Python 3.11+** | ML/veri bilimi ekosisteminin standardı |
| Çatı | **FastAPI** | Hızlı, async, otomatik OpenAPI dokümanı |
| Şema | **Pydantic** | Tip güvenli istek/yanıt doğrulaması |
| Sunucu | **Uvicorn** | ASGI sunucusu |
| ML (ileride) | **scikit-learn / PyTorch** | Tahmin modeli eğitimi |

## 🚀 Kurulum

```bash
cd ai
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000
```

Etkileşimli API dokümanı: `http://localhost:8000/docs`

## 🔌 Uç Noktalar

| Metot | Yol | Açıklama |
|-------|-----|----------|
| `GET` | `/health` | Sağlık kontrolü |
| `POST` | `/predict` | Kriz tahmini üretir |

### `POST /predict` — sözleşme

İstek:
```json
{
  "flights": [
    { "code": "TK1985", "delayMin": 30, "region": "Avrupa" }
  ]
}
```

Yanıt:
```json
{
  "source": "heuristic-skeleton",
  "riskIndex": 75,
  "delays": [
    { "region": "Avrupa", "level": "Yüksek", "extraHours": 2.5 },
    { "region": "Asya", "level": "Orta", "extraHours": 1 }
  ],
  "suggestions": [
    "Yaklaşan fırtına nedeniyle Londra'da 50 otel odasını önceden ayırın.",
    "Hava sistemini aşmak için uçuşları Orta Avrupa üzerinden yeniden yönlendirin."
  ]
}
```

> Bu sözleşme `backend/src/services/aiClient.js` ile birebir uyumludur.

## 📂 Yapı

```
ai/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app + uç noktalar
│   ├── schemas.py       # Pydantic modelleri
│   └── predictor.py     # Yer tutucu tahmin mantığı
├── requirements.txt
└── .env.example
```

## ✅ Yapılacaklar

- [ ] Gerçek özellik mühendisliği (hava durumu, yoğunluk, tarihsel gecikme)
- [ ] ML modeli eğitimi (scikit-learn ile başlangıç)
- [ ] Model versiyonlama ve değerlendirme metrikleri
- [ ] Tahmin önbellekleme

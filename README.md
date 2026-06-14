<div align="center">

# 🛫 ORBIS — Global Komuta Platformu

**Turkish Airlines için yapay zeka destekli global operasyon komuta merkezi**

3B dünya küresi · Kriz tahmincisi · Kaynak yönetimi · Discord tarzı iletişim merkezi

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node_+_Express-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/AI-Python_+_FastAPI-009688?logo=fastapi&logoColor=white)

</div>

---

## 🏗️ Mimari (Monorepo)

Proje üç bağımsız servise ayrılmıştır; her biri kendi klasöründe, kendi
bağımlılıkları ve README'si ile yaşar:

```
ORBIS/
├── frontend/   → React 19 + Vite arayüzü (gösterge paneli)
├── backend/    → Node.js + Express REST API (veri / ağ geçidi)
└── ai/         → Python + FastAPI yapay zeka servisi (kriz tahmini)
```

### Veri akışı

```
┌────────────┐      REST       ┌────────────┐      REST       ┌────────────┐
│  frontend  │ ───────────────▶│  backend   │ ───────────────▶│    ai      │
│  (React)   │◀─────────────── │ (Express)  │◀─────────────── │ (FastAPI)  │
└────────────┘   JSON / WS     └────────────┘   tahmin (JSON) └────────────┘
   tarayıcı        :5173            API :4000                    ML :8000
```

- **frontend** kullanıcı arayüzünü sunar, `backend`'den veri çeker.
- **backend** uçuş/filo/kaynak verisini sağlar ve kriz tahmini için `ai` servisini çağırır.
- **ai** "Aksaklık Risk Endeksi"ni ve önerileri üreten yapay zeka modelini barındırır.

> Şu an **frontend** tamamlanmış, **backend** ve **ai** iskelet/placeholder aşamasındadır.

---

## 🚀 Hızlı Başlangıç

Her servis ayrı terminalde çalıştırılır:

```bash
# 1) Frontend  (http://localhost:5173)
cd frontend && npm install && npm run dev

# 2) Backend   (http://localhost:4000)
cd backend && npm install && npm run dev

# 3) AI servisi (http://localhost:8000)
cd ai && pip install -r requirements.txt && uvicorn app.main:app --reload
```

Her klasörün kendi `README.md` dosyasında ayrıntılı kurulum vardır.

---

## 📦 Servisler

| Servis | Teknoloji | Durum | Klasör |
|--------|-----------|-------|--------|
| Arayüz | React 19, Vite 8, Tailwind 3, d3-geo | ✅ Hazır | [`frontend/`](frontend) |
| API | Node.js, Express | 🚧 İskelet | [`backend/`](backend) |
| Yapay Zeka | Python, FastAPI | 🚧 İskelet | [`ai/`](ai) |

---

## 🗺️ Yol Haritası

- [x] Frontend gösterge paneli (5 sayfa, 3B küre, kriz paneli)
- [ ] Backend REST API'nin tamamlanması (auth, veri uç noktaları)
- [ ] AI kriz tahmin modelinin eğitilmesi ve servise bağlanması
- [ ] Frontend ↔ Backend ↔ AI canlı entegrasyonu
- [ ] WebSocket ile gerçek zamanlı veri akışı
- [ ] CI/CD + bulut dağıtımı (Vercel + Railway/Fly)

## 📄 Lisans

Eğitim/demo amaçlıdır. Turkish Airlines markası ve logosu ilgili sahibine aittir.

---

<div align="center">
Turkish Airlines · ORBIS
</div>

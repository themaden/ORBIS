"""ORBIS AI — IRROPS risk & gecikme modeli.

Şeffaf, ağırlıklı lojistik model (saf Python). Her faktörün katkısı
açıklanabilir biçimde döner — jüri "neden bu skor?" sorusuna cevap verilebilir.
İleride scikit-learn ile eğitilmiş modelle değiştirilebilir.
"""
from __future__ import annotations

import math

from .schemas import (
    DelayRequest,
    DelayResponse,
    RiskFactor,
    RiskRequest,
    RiskResponse,
)


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def score_risk(r: RiskRequest) -> RiskResponse:
    cancel_rate = r.cancelled / max(r.totalFlights, 1)
    delay_rate = r.delayed / max(r.totalFlights, 1)

    # (ad, değer 0-1, ağırlık)
    terms = [
        ("İptal oranı", min(cancel_rate * 3, 1.0), 2.6),
        ("Gecikme oranı", min(delay_rate * 2, 1.0), 1.6),
        ("Doluluk", r.avgLoadFactor, 1.0),
        ("Hava şiddeti", r.weatherSeverity, 2.0),
        ("Hub yoğunluğu", r.hubCongestion, 1.3),
    ]

    raw = [(name, val * w) for name, val, w in terms]
    total_raw = sum(v for _, v in raw) or 1.0

    # 0-100 risk endeksi (lojistik, eğri merkezini ortaya çek)
    z = -2.2 + sum(v for _, v in raw)
    risk_index = round(_sigmoid(z) * 100)

    factors = [
        RiskFactor(name=name, contribution=round(v / total_raw * risk_index))
        for name, v in raw
    ]

    level = "Yüksek" if risk_index >= 66 else "Orta" if risk_index >= 40 else "Düşük"

    suggestions: list[str] = []
    top = max(raw, key=lambda x: x[1])[0]
    if top == "Hava şiddeti":
        suggestions.append("Etkilenen bölgedeki uçuşları yeniden yönlendirin ve otel ön rezervasyonu açın.")
    if top == "Hub yoğunluğu":
        suggestions.append("Hub'da gate/slot tahsisini sıkılaştırın, transfer sürelerine tampon ekleyin.")
    if cancel_rate > 0.1:
        suggestions.append("Passenger care kapasitesini (otel/ikram/transfer) önceden artırın.")
    if not suggestions:
        suggestions.append("Operasyon normal seyirde; mevcut planı sürdürün.")

    return RiskResponse(
        riskIndex=risk_index, level=level, factors=factors, suggestions=suggestions
    )


def predict_delay(r: DelayRequest) -> DelayResponse:
    # Eğitilmiş RandomForest modeli (varsa); yoksa sezgisel fallback
    try:
        from .ml import MODEL

        prob, expected = MODEL.predict(
            r.departureHour, r.loadFactor, r.routeHaulHours, r.weatherSeverity
        )
    except Exception:
        peak = 1.0 if 16 <= r.departureHour <= 21 else 0.4 if 6 <= r.departureHour <= 9 else 0.1
        z = (
            -1.4
            + peak * 1.1
            + r.loadFactor * 1.0
            + min(r.routeHaulHours / 12, 1.0) * 0.8
            + r.weatherSeverity * 2.2
        )
        prob = _sigmoid(z)
        expected = round(prob * (30 + r.weatherSeverity * 150 + r.routeHaulHours * 4))

    band = "Yüksek" if prob >= 0.6 else "Orta" if prob >= 0.35 else "Düşük"

    explain = None
    try:
        from .ml import MODEL

        explain = MODEL.explain(
            r.departureHour, r.loadFactor, r.routeHaulHours, r.weatherSeverity
        )
    except Exception:
        pass

    return DelayResponse(
        delayProbability=round(prob, 3),
        expectedDelayMin=expected,
        band=band,
        explain=explain,
    )

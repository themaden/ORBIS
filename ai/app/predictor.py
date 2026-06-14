"""Yer tutucu kriz tahmin mantığı.

NOT: Bu gerçek bir ML modeli DEĞİLDİR. İleride scikit-learn / PyTorch tabanlı
eğitilmiş bir modelle değiştirilecek basit bir sezgisel (heuristic) hesaptır.
"""
from __future__ import annotations

from .schemas import Delay, PredictRequest, PredictResponse


def predict(req: PredictRequest) -> PredictResponse:
    total_delay = sum(f.delayMin for f in req.flights)
    # Toplam gecikmeden kaba bir risk endeksi türet (0-95 arası)
    risk_index = min(95, 40 + total_delay // 10)

    return PredictResponse(
        source="heuristic-skeleton",
        riskIndex=risk_index,
        delays=[
            Delay(region="Avrupa", level="Yüksek", extraHours=2.5),
            Delay(region="Asya", level="Orta", extraHours=1.0),
        ],
        suggestions=[
            "Yaklaşan fırtına nedeniyle Londra'da 50 otel odasını önceden ayırın.",
            "Hava sistemini aşmak için uçuşları Orta Avrupa üzerinden yeniden yönlendirin.",
        ],
    )

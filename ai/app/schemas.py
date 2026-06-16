"""ORBIS AI — IRROPS risk skorlama şemaları (Pydantic)."""
from __future__ import annotations

from pydantic import BaseModel, Field


class RiskRequest(BaseModel):
    totalFlights: int = Field(0, ge=0)
    cancelled: int = Field(0, ge=0)
    delayed: int = Field(0, ge=0)
    avgLoadFactor: float = Field(0.8, ge=0, le=1)  # ortalama doluluk
    weatherSeverity: float = Field(0.3, ge=0, le=1)  # hava şiddeti
    hubCongestion: float = Field(0.4, ge=0, le=1)  # hub yoğunluğu


class RiskFactor(BaseModel):
    name: str
    contribution: int  # riskIndex'e katkı (açıklanabilirlik)


class RiskResponse(BaseModel):
    riskIndex: int
    level: str  # Düşük / Orta / Yüksek
    factors: list[RiskFactor]
    suggestions: list[str]
    source: str = "orbis-ai"


class DelayRequest(BaseModel):
    departureHour: int = Field(12, ge=0, le=23)
    loadFactor: float = Field(0.85, ge=0, le=1)
    routeHaulHours: float = Field(3, ge=0)
    weatherSeverity: float = Field(0.3, ge=0, le=1)


class ExplainFactor(BaseModel):
    feature: str
    contribution: float  # -1..1, tahmine göreli katkı
    input: float  # normalize edilmiş girdi (0..1)


class DelayResponse(BaseModel):
    delayProbability: float  # 0-1
    expectedDelayMin: int
    band: str  # Düşük / Orta / Yüksek
    explain: list[ExplainFactor] | None = None


class DelayBatchRequest(BaseModel):
    items: list[DelayRequest]


class DelayBatchResponse(BaseModel):
    predictions: list[DelayResponse]


class ConfusionMatrix(BaseModel):
    tp: int  # gerçek pozitif (önemli gecikme tahmin edildi, gerçekten geç)
    fp: int  # yanlış alarm
    tn: int  # doğru negatif
    fn: int  # kaçırılan gecikme


class ModelInfo(BaseModel):
    delayModel: str
    dataSource: str  # "synthetic" veya "BTS 2008 (Kaggle)..."
    note: str
    maeMin: float  # holdout ortalama mutlak hata (dk)
    rmseMin: float
    auc: float  # önemli gecikme sınıflandırma AUC
    precision: float
    recall: float
    f1: float
    confusion: ConfusionMatrix
    featureImportances: dict[str, float]
    nTrain: int
    nTest: int


# ---- Optimal atama (min-cost flow) ----
class AssignPassenger(BaseModel):
    passengerId: str
    ticketClass: str  # ECONOMY | BUSINESS
    priority: int = Field(50, ge=0, le=100)


class AssignAlternative(BaseModel):
    flightId: str
    economyAvail: int = 0
    businessAvail: int = 0
    addedDelayMin: int = 0


class AssignRequest(BaseModel):
    passengers: list[AssignPassenger]
    alternatives: list[AssignAlternative]


class Assignment(BaseModel):
    passengerId: str
    toFlightId: str | None = None
    addedDelayMin: int | None = None


class AssignResponse(BaseModel):
    assignments: list[Assignment]
    assignedCount: int
    method: str = "min-cost-flow"


# ---- Explainability (SHAP yerine hafif local explainer) ----
class ExplanationFeature(BaseModel):
    """Bir özelliğin tahmine katkısı."""

    name: str  # örn "weatherSeverity"
    value: float  # normalize edilmiş girdi (0-1)
    importance: float  # global feature importance
    contribution: float  # local katkı büyüklüğü
    direction: str  # "↑ arttırıyor" veya "↓ azaltıyor"


class ModelExplanationResponse(BaseModel):
    """Tahmine ait açıklama (SHAP yerine hafif local)."""

    prediction: float  # tahmini gecikme dakika
    probability: float  # gecikme olasılığı (0-1)
    features: list[ExplanationFeature]  # sıralanmış katkı
    top_factor: str  # en etkili faktör
    band: str  # "Yüksek" / "Orta" / "Düşük"
    insight: str  # insan tarafından okunabilir açıklama


class PartialDependenceItem(BaseModel):
    """Partial dependence: bir özelliğin değişmesiyle tahmin nasıl değişir."""

    feature_value: float
    prediction_min: float
    probability: float


class PartialDependenceResponse(BaseModel):
    """Partial dependence curve approximation (görselleştirme için)."""

    feature: str
    values: list[PartialDependenceItem]


# ---- Model versiyonlama + yeniden eğitim ----
class ModelVersion(BaseModel):
    version: str
    trainedAt: str
    source: str
    mae: float
    rmse: float
    auc: float
    f1: float
    nTrain: int
    nTest: int
    active: bool


class RetrainRequest(BaseModel):
    maxRows: int = Field(500_000, ge=1000, le=2_000_000)
    forceRetrain: bool = False


class RetrainResponse(BaseModel):
    version: str
    trainedAt: str
    source: str
    mae: float
    rmse: float
    auc: float
    f1: float
    nTrain: int
    nTest: int
    durationSec: float
    improvement: dict  # {"mae": delta, "auc": delta}


# ---- Tahmin doğruluk kaydı (backend'den POST edilir) ----
class PredictionFeedback(BaseModel):
    flightId: str
    predictedDelayMin: int
    actualDelayMin: int


class AccuracyStats(BaseModel):
    totalPredictions: int
    correctWithin15Min: int
    correctWithin30Min: int
    accuracy15: float
    accuracy30: float
    avgAbsError: float
    lastUpdated: str

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


class DelayResponse(BaseModel):
    delayProbability: float  # 0-1
    expectedDelayMin: int
    band: str  # Düşük / Orta / Yüksek


class DelayBatchRequest(BaseModel):
    items: list[DelayRequest]


class DelayBatchResponse(BaseModel):
    predictions: list[DelayResponse]


class ModelInfo(BaseModel):
    delayModel: str
    note: str
    maeMin: float  # holdout ortalama mutlak hata (dk)
    rmseMin: float
    auc: float  # önemli gecikme sınıflandırma AUC
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

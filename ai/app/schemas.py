"""ORBIS AI servisi — Pydantic şemaları.

İstek/yanıt sözleşmesi backend/src/services/aiClient.js ile uyumludur.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class Flight(BaseModel):
    code: str = Field(..., examples=["TK1985"])
    delayMin: int = Field(0, ge=0, description="Dakika cinsinden gecikme")
    region: str | None = Field(None, examples=["Avrupa"])


class PredictRequest(BaseModel):
    flights: list[Flight] = Field(default_factory=list)


class Delay(BaseModel):
    region: str
    level: str  # "Düşük" | "Orta" | "Yüksek"
    extraHours: float


class PredictResponse(BaseModel):
    source: str
    riskIndex: int = Field(..., ge=0, le=100)
    delays: list[Delay]
    suggestions: list[str]

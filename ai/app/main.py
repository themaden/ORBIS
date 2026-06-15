"""ORBIS AI servisi — IRROPS risk & gecikme tahmini (FastAPI).

Çalıştır:  uvicorn app.main:app --reload --port 8000
Doküman:   http://localhost:8000/docs
"""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model import predict_delay, score_risk
from .schemas import DelayRequest, DelayResponse, RiskRequest, RiskResponse

app = FastAPI(
    title="ORBIS AI",
    description="Turkish Airlines ORBIS — IRROPS risk skorlama & gecikme tahmini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_ORIGIN", "http://localhost:4000"), "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "orbis-ai", "model": "weighted-logistic"}


@app.post("/risk/score", response_model=RiskResponse)
def risk(req: RiskRequest) -> RiskResponse:
    return score_risk(req)


@app.post("/predict/delay", response_model=DelayResponse)
def delay(req: DelayRequest) -> DelayResponse:
    return predict_delay(req)

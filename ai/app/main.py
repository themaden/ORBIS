"""ORBIS AI servisi — IRROPS risk & gecikme tahmini (FastAPI).

Çalıştır:  uvicorn app.main:app --reload --port 8000
Doküman:   http://localhost:8000/docs
"""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .assign import optimal_assign
from .model import predict_delay, score_risk
from .schemas import (
    AssignRequest,
    AssignResponse,
    DelayBatchRequest,
    DelayBatchResponse,
    DelayRequest,
    DelayResponse,
    ModelInfo,
    RiskRequest,
    RiskResponse,
)

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
    info = {"status": "ok", "service": "orbis-ai", "risk": "weighted-logistic", "assign": "min-cost-flow"}
    try:
        from .ml import MODEL

        info["delayModel"] = f"random-forest (MAE={MODEL.mae} dk, AUC={MODEL.auc})"
    except Exception:
        info["delayModel"] = "heuristic"
    return info


@app.get("/model/info", response_model=ModelInfo)
def model_info() -> ModelInfo:
    from .ml import MODEL

    return ModelInfo(
        delayModel="RandomForest (regresyon + sınıflandırma)",
        note="Sentetik veri, holdout test ile değerlendirildi (gerçek veriyle değiştirilebilir).",
        maeMin=MODEL.mae,
        rmseMin=MODEL.rmse,
        auc=MODEL.auc,
        featureImportances=MODEL.importances,
        nTrain=MODEL.n_train,
        nTest=MODEL.n_test,
    )


@app.post("/risk/score", response_model=RiskResponse)
def risk(req: RiskRequest) -> RiskResponse:
    return score_risk(req)


@app.post("/predict/delay", response_model=DelayResponse)
def delay(req: DelayRequest) -> DelayResponse:
    return predict_delay(req)


@app.post("/predict/delay/batch", response_model=DelayBatchResponse)
def delay_batch(req: DelayBatchRequest) -> DelayBatchResponse:
    return DelayBatchResponse(predictions=[predict_delay(it) for it in req.items])


@app.post("/assign", response_model=AssignResponse)
def assign(req: AssignRequest) -> AssignResponse:
    return optimal_assign(req)

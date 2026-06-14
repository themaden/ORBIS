"""ORBIS AI servisi — FastAPI giriş noktası.

Çalıştırma:  uvicorn app.main:app --reload
Doküman:     http://localhost:8000/docs
"""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .predictor import predict
from .schemas import PredictRequest, PredictResponse

app = FastAPI(
    title="ORBIS AI",
    description="Turkish Airlines ORBIS — kriz tahmin servisi (iskelet)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_ORIGIN", "http://localhost:4000")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "orbis-ai", "model": "heuristic-skeleton"}


@app.post("/predict", response_model=PredictResponse)
def predict_endpoint(req: PredictRequest) -> PredictResponse:
    return predict(req)

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
    ConfusionMatrix,
    DelayBatchRequest,
    DelayBatchResponse,
    DelayRequest,
    DelayResponse,
    ModelExplanationResponse,
    ModelInfo,
    PartialDependenceItem,
    PartialDependenceResponse,
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

    note = (
        "Gerçek BTS verisiyle eğitildi; holdout test ile değerlendirildi."
        if not MODEL.source.startswith("synthetic")
        else "Sentetik veri, holdout test ile değerlendirildi (gerçek veriyle değiştirilebilir)."
    )
    return ModelInfo(
        delayModel="RandomForest (regresyon + sınıflandırma)",
        dataSource=MODEL.source,
        note=note,
        maeMin=MODEL.mae,
        rmseMin=MODEL.rmse,
        auc=MODEL.auc,
        precision=MODEL.precision,
        recall=MODEL.recall,
        f1=MODEL.f1,
        confusion=ConfusionMatrix(**MODEL.cm),
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


# ---- EXPLAINABILITY (SHAP yerine hafif local explainer) ----


@app.post("/explain/delay", response_model=ModelExplanationResponse)
def explain_delay(req: DelayRequest) -> ModelExplanationResponse:
    """Gecikme tahmininin açıklaması — SHAP yerine hafif local explainer.

    Her özelliğin tahmine katkısını gösterir:
    - feature importance × normalized input value
    - decision path from trees
    - İnsan tarafından okunabilir insight
    """
    from .explainer import LocalExplainer
    from .ml import MODEL

    explainer = LocalExplainer(
        MODEL.reg, MODEL.clf, MODEL.importances, delay_threshold=30
    )
    expl = explainer.explain(
        req.departureHour, req.loadFactor, req.routeHaulHours, req.weatherSeverity
    )

    return ModelExplanationResponse(
        prediction=expl.prediction,
        probability=expl.probability,
        features=[
            {
                "name": f.name,
                "value": f.value,
                "importance": f.importance,
                "contribution": f.contribution,
                "direction": f.direction,
            }
            for f in expl.features
        ],
        top_factor=expl.top_factor,
        band=expl.band,
        insight=expl.insight,
    )


@app.get("/explain/partial-dependence/{feature}", response_model=PartialDependenceResponse)
def partial_dependence(feature: str) -> PartialDependenceResponse:
    """Bir özelliğin çıkış üzerindeki etkisini gösterir (Partial Dependence curve).

    Örn: `GET /explain/partial-dependence/weatherSeverity`
    → hava şiddetinin 0'dan 1'e gidişinde tahmin nasıl değişir?
    """
    from .explainer import LocalExplainer
    from .ml import MODEL

    if feature not in ["departureHour", "loadFactor", "routeHaulHours", "weatherSeverity"]:
        raise ValueError(
            f"Geçersiz feature: {feature}. Desteklenenler: departureHour, loadFactor, routeHaulHours, weatherSeverity"
        )

    explainer = LocalExplainer(
        MODEL.reg, MODEL.clf, MODEL.importances, delay_threshold=30
    )
    pd_vals = explainer.partial_dependence_summary(feature, num_samples=8)

    # Şemaya uygun dönüştür
    items = [
        PartialDependenceItem(
            feature_value=pd_item["feature_value"],
            prediction_min=pd_item["prediction_min"],
            probability=pd_item["probability"],
        )
        for pd_item in pd_vals
    ]

    return PartialDependenceResponse(feature=feature, values=items)


@app.get("/explain/feature-importance")
def feature_importance() -> dict:
    """Global feature importance (tüm model tarafından)."""
    from .ml import MODEL

    return {
        "importances": MODEL.importances,
        "note": "Ağırlıklar 0-1 arası; büyük değer = daha etkili",
        "ranking": sorted(
            MODEL.importances.items(), key=lambda x: x[1], reverse=True
        ),
    }

"""ORBIS AI servisi — IRROPS risk & gecikme tahmini (FastAPI).

Çalıştır:  uvicorn app.main:app --reload --port 8000
Doküman:   http://localhost:8000/docs
"""
from __future__ import annotations

import os
import time as _time

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .assign import optimal_assign
from .model import predict_delay, score_risk
from .schemas import (
    AccuracyStats,
    AssignRequest,
    AssignResponse,
    ConfusionMatrix,
    DelayBatchRequest,
    DelayBatchResponse,
    DelayRequest,
    DelayResponse,
    ModelExplanationResponse,
    ModelInfo,
    ModelVersion,
    PartialDependenceItem,
    PartialDependenceResponse,
    PredictionFeedback,
    RetrainRequest,
    RetrainResponse,
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


# ---- Model versiyonlama ----

@app.get("/model/versions", response_model=list[ModelVersion])
def model_versions() -> list[ModelVersion]:
    """Tüm eğitilmiş model versiyonlarını listeler."""
    from .ml import get_model_versions
    return [ModelVersion(**v) for v in get_model_versions()]


# Arka planda yeniden eğitim durumu
_retrain_status: dict = {"running": False, "result": None, "error": None}


def _do_retrain(max_rows: int) -> None:
    global _retrain_status
    _retrain_status = {"running": True, "result": None, "error": None}
    t0 = _time.time()
    try:
        from .ml import DelayModel, MODEL, MODEL_FILE, MAX_ROWS
        import importlib, sys

        old_mae = MODEL.mae
        old_auc = MODEL.auc

        # MODEL_FILE'ı sil → yeniden eğitimi zorla
        if MODEL_FILE.exists():
            MODEL_FILE.unlink()

        # Modülü yeniden yükle (yeni MODEL nesnesi oluşturulsun)
        import app.ml as ml_module
        ml_module.MAX_ROWS = max_rows
        new_model = DelayModel()

        # Global MODEL'i güncelle
        ml_module.MODEL = new_model

        duration = round(_time.time() - t0, 1)
        _retrain_status = {
            "running": False,
            "error": None,
            "result": {
                "version": new_model.version,
                "trainedAt": new_model.trained_at,
                "source": new_model.source,
                "mae": new_model.mae,
                "rmse": new_model.rmse,
                "auc": new_model.auc,
                "f1": new_model.f1,
                "nTrain": new_model.n_train,
                "nTest": new_model.n_test,
                "durationSec": duration,
                "improvement": {
                    "mae": round(old_mae - new_model.mae, 2),
                    "auc": round(new_model.auc - old_auc, 3),
                },
            },
        }
    except Exception as e:
        _retrain_status = {"running": False, "result": None, "error": str(e)}


@app.post("/model/retrain", response_model=dict)
def model_retrain(req: RetrainRequest, background_tasks: BackgroundTasks) -> dict:
    """Modeli arka planda yeniden eğitir. GET /model/retrain/status ile takip edin."""
    if _retrain_status.get("running"):
        raise HTTPException(status_code=409, detail="Zaten eğitim devam ediyor.")
    background_tasks.add_task(_do_retrain, req.maxRows)
    return {"ok": True, "message": "Yeniden eğitim arka planda başlatıldı. /model/retrain/status ile takip edin."}


@app.get("/model/retrain/status")
def retrain_status() -> dict:
    """Yeniden eğitim durumunu döner."""
    return _retrain_status


# ---- Tahmin geri bildirimi ve doğruluk takibi ----
_feedback_log: list[dict] = []


@app.post("/model/feedback")
def prediction_feedback(fb: PredictionFeedback) -> dict:
    """Gerçek gecikme sonucu gelince tahmin doğruluğunu günceller."""
    error = abs(fb.predictedDelayMin - fb.actualDelayMin)
    _feedback_log.append({
        "flightId": fb.flightId,
        "predicted": fb.predictedDelayMin,
        "actual": fb.actualDelayMin,
        "absError": error,
        "within15": error <= 15,
        "within30": error <= 30,
        "ts": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime()),
    })
    return {"ok": True, "totalFeedback": len(_feedback_log)}


@app.get("/model/accuracy", response_model=AccuracyStats)
def model_accuracy() -> AccuracyStats:
    """In-memory tahmin doğruluğu istatistikleri."""
    n = len(_feedback_log)
    if n == 0:
        from .ml import MODEL
        return AccuracyStats(
            totalPredictions=0,
            correctWithin15Min=0,
            correctWithin30Min=0,
            accuracy15=0.0,
            accuracy30=0.0,
            avgAbsError=0.0,
            lastUpdated=_time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime()),
        )
    c15 = sum(1 for f in _feedback_log if f["within15"])
    c30 = sum(1 for f in _feedback_log if f["within30"])
    avg_err = sum(f["absError"] for f in _feedback_log) / n
    return AccuracyStats(
        totalPredictions=n,
        correctWithin15Min=c15,
        correctWithin30Min=c30,
        accuracy15=round(c15 / n, 3),
        accuracy30=round(c30 / n, 3),
        avgAbsError=round(avg_err, 1),
        lastUpdated=_feedback_log[-1]["ts"],
    )

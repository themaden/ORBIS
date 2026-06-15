"""ORBIS AI — gerçek ML gecikme modeli (scikit-learn RandomForest).

Gerçek tarihsel veri olmadığı için operasyonel ilişkilerden (etkileşimli,
heteroskedastik gürültülü) sentetik bir set üretilir; model **train/test
ayrımı** ile eğitilir ve **holdout test metrikleri** dürüstçe raporlanır.
Aynı arayüz korunarak ileride gerçek uçuş verisiyle değiştirilebilir.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    roc_auc_score,
    root_mean_squared_error,
)
from sklearn.model_selection import train_test_split

FEATURES = ["departureHour", "loadFactor", "routeHaulHours", "weatherSeverity"]
DELAY_THRESHOLD = 30  # "önemli gecikme" eşiği (dk)


def _generate(n: int = 6000, seed: int = 42):
    rng = np.random.default_rng(seed)
    hour = rng.integers(0, 24, n)
    load = rng.uniform(0.45, 1.0, n)
    haul = rng.uniform(1, 14, n)
    weather = rng.uniform(0, 1, n)

    peak = ((hour >= 16) & (hour <= 21)) * 1.0 + ((hour >= 6) & (hour <= 9)) * 0.4
    # doğrusal olmayan etkileşim (hava × doluluk) + havaya bağlı belirsizlik
    base = 4 + weather * 120 + peak * 30 + (load - 0.5) * 50 + haul * 2 + (weather * load) * 60
    noise = rng.normal(0, 8 + weather * 25, n)
    delay = np.clip(base + noise, 0, None)

    X = np.column_stack([hour, load, haul, weather])
    return X, delay


class DelayModel:
    def __init__(self) -> None:
        X, y = _generate()
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)

        self.reg = RandomForestRegressor(
            n_estimators=120, max_depth=14, random_state=0, n_jobs=-1
        ).fit(X_tr, y_tr)
        self.clf = RandomForestClassifier(
            n_estimators=120, max_depth=14, random_state=0, n_jobs=-1
        ).fit(X_tr, (y_tr > DELAY_THRESHOLD).astype(int))

        # --- DÜRÜST holdout metrikleri ---
        pred = self.reg.predict(X_te)
        self.mae = round(float(mean_absolute_error(y_te, pred)), 1)
        self.rmse = round(float(root_mean_squared_error(y_te, pred)), 1)
        proba = self.clf.predict_proba(X_te)[:, 1]
        self.auc = round(float(roc_auc_score((y_te > DELAY_THRESHOLD).astype(int), proba)), 3)
        self.importances = {
            f: round(float(v), 3) for f, v in zip(FEATURES, self.reg.feature_importances_)
        }
        self.n_train = int(len(X_tr))
        self.n_test = int(len(X_te))

    def predict(self, hour: int, load: float, haul: float, weather: float):
        x = [[hour, load, haul, weather]]
        minutes = max(0, round(float(self.reg.predict(x)[0])))
        prob = float(self.clf.predict_proba(x)[0][1])
        return prob, minutes


# Servis açılışında bir kez eğitilir
MODEL = DelayModel()

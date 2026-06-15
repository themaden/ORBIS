"""ORBIS AI — gerçek ML gecikme modeli (scikit-learn RandomForest).

Gerçek tarihsel veri olmadığı için, operasyonel olarak makul ilişkilerden
sentetik bir eğitim seti üretilir ve servis açılışında model eğitilir.
İleride gerçek uçuş verisiyle aynı arayüz korunarak değiştirilebilir.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor


def _generate(n: int = 3000, seed: int = 42):
    rng = np.random.default_rng(seed)
    hour = rng.integers(0, 24, n)
    load = rng.uniform(0.5, 1.0, n)
    haul = rng.uniform(1, 14, n)
    weather = rng.uniform(0, 1, n)

    peak = ((hour >= 16) & (hour <= 21)).astype(float) * 1.0 + (
        (hour >= 6) & (hour <= 9)
    ).astype(float) * 0.4
    base = 5 + weather * 130 + peak * 35 + (load - 0.5) * 45 + haul * 2.5
    noise = rng.normal(0, 12, n)
    delay = np.clip(base + noise, 0, None)

    X = np.column_stack([hour, load, haul, weather])
    return X, delay


class DelayModel:
    def __init__(self) -> None:
        X, y = _generate()
        self.reg = RandomForestRegressor(
            n_estimators=80, max_depth=12, random_state=0, n_jobs=-1
        ).fit(X, y)
        # "Önemli gecikme" = 30+ dk (sınıf dengesi için)
        self.clf = RandomForestClassifier(
            n_estimators=80, max_depth=12, random_state=0, n_jobs=-1
        ).fit(X, (y > 30).astype(int))
        # basit eğitim metriği (açıklama için)
        self.train_r2 = round(float(self.reg.score(X, y)), 3)

    def predict(self, hour: int, load: float, haul: float, weather: float):
        x = [[hour, load, haul, weather]]
        minutes = max(0, round(float(self.reg.predict(x)[0])))
        prob = float(self.clf.predict_proba(x)[0][1])
        return prob, minutes


# Servis açılışında bir kez eğitilir
MODEL = DelayModel()

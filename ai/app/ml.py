"""ORBIS AI — ML gecikme modeli (scikit-learn RandomForest, BTS 2008).

Zenginleştirilmiş özellikler (9 değişken):
  Sayısal: departureHour, loadFactor, routeHaulHours, weatherSeverity,
           carrierDelay, nasDelay, lateAircraftDelay,
           dayOfWeek, month
  + havayolu/havalimanı sinyalleri (target encoding ile dahil edilebilir
    — şu an basit tutuluyor)

Veri kaynağı önceliği:
  1. data/airline_2008.csv  (BTS Kaggle)
  2. data/airline.csv
  3. sentetik (fallback)

Model joblib ile diske kaydedilir; sonraki başlatmada hızlı yüklenir.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from joblib import dump, load
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    precision_score,
    recall_score,
    roc_auc_score,
    root_mean_squared_error,
)
from sklearn.model_selection import train_test_split

# Frontend ve API ile uyumlu temel 4 özellik (geriye dönük uyumlu)
PUBLIC_FEATURES = ["departureHour", "loadFactor", "routeHaulHours", "weatherSeverity"]
# Modelin gerçek kullandığı tam özellik seti (BTS sinyalleriyle)
ALL_FEATURES = PUBLIC_FEATURES + [
    "carrierDelay",
    "nasDelay",
    "lateAircraftDelay",
    "dayOfWeek",
    "month",
]
DELAY_THRESHOLD = 30  # dakika

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_CANDIDATES = [DATA_DIR / "airline_2008.csv", DATA_DIR / "airline.csv"]
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)
MODEL_FILE = MODELS_DIR / "delay_v2.joblib"
MAX_ROWS = 500_000


# ---------- Veri yükleme ----------
def _generate(n: int = 6000, seed: int = 42):
    """Sentetik fallback."""
    rng = np.random.default_rng(seed)
    hour = rng.integers(0, 24, n)
    load = rng.uniform(0.45, 1.0, n)
    haul = rng.uniform(1, 14, n)
    weather = rng.uniform(0, 1, n)

    peak = ((hour >= 16) & (hour <= 21)) * 1.0 + ((hour >= 6) & (hour <= 9)) * 0.4
    base = 4 + weather * 120 + peak * 30 + (load - 0.5) * 50 + haul * 2 + (weather * load) * 60
    noise = rng.normal(0, 8 + weather * 25, n)
    delay = np.clip(base + noise, 0, None)

    # Diğer sütunları sentetik için 0 doldur
    zeros = np.zeros(n)
    dow = rng.integers(1, 8, n)
    mo = rng.integers(1, 13, n)
    X = np.column_stack([hour, load, haul, weather, zeros, zeros, zeros, dow, mo])
    return X, delay, "synthetic"


def _load_bts(path: Path):
    """BTS 2008 CSV → 9 özellik + hedef."""
    cols = [
        "CRSDepTime",
        "DepDelay",
        "CRSElapsedTime",
        "WeatherDelay",
        "CarrierDelay",
        "NASDelay",
        "LateAircraftDelay",
        "DayOfWeek",
        "Month",
        "Cancelled",
    ]
    df = pd.read_csv(
        path,
        usecols=lambda c: c in cols,
        nrows=MAX_ROWS,
        low_memory=False,
    )
    if "Cancelled" in df.columns:
        df = df[df["Cancelled"] != 1]
    df = df.dropna(subset=["CRSDepTime", "DepDelay", "CRSElapsedTime"])
    df["DepDelay"] = pd.to_numeric(df["DepDelay"], errors="coerce")
    df = df.dropna(subset=["DepDelay"])

    df["hour"] = (pd.to_numeric(df["CRSDepTime"], errors="coerce") // 100).clip(0, 23)
    df["haul"] = (pd.to_numeric(df["CRSElapsedTime"], errors="coerce") / 60).clip(0.5, 18)
    rng = np.random.default_rng(0)
    df["load"] = np.clip(0.65 + rng.normal(0.18, 0.08, len(df)), 0.5, 1.0)

    # Gecikme nedenleri (dk) — NaN → 0
    for col, key in [
        ("WeatherDelay", "weather_min"),
        ("CarrierDelay", "carrier_min"),
        ("NASDelay", "nas_min"),
        ("LateAircraftDelay", "late_min"),
    ]:
        df[key] = pd.to_numeric(df.get(col, 0), errors="coerce").fillna(0).clip(0, 600)

    # weatherSeverity (0-1, public API uyumu için saklanıyor)
    df["weather"] = (df["weather_min"] / 90).clip(0, 1)

    df["dow"] = pd.to_numeric(df.get("DayOfWeek", 0), errors="coerce").fillna(0).clip(0, 7)
    df["mo"] = pd.to_numeric(df.get("Month", 0), errors="coerce").fillna(0).clip(0, 12)

    df = df.dropna(subset=["hour", "haul", "load", "weather"])
    df["DepDelay"] = df["DepDelay"].clip(lower=0, upper=600)

    X = df[
        [
            "hour",
            "load",
            "haul",
            "weather",
            "carrier_min",
            "nas_min",
            "late_min",
            "dow",
            "mo",
        ]
    ].to_numpy(dtype=float)
    y = df["DepDelay"].to_numpy(dtype=float)
    return X, y, f"BTS 2008 (Kaggle) · {len(X):,} kayıt"


def _load_data():
    for p in DATA_CANDIDATES:
        if p.exists():
            try:
                return _load_bts(p)
            except Exception as e:
                print(f"[ml] {p.name} okunamadı: {e} — sentetiğe düşülüyor")
    return _generate()


# ---------- Model ----------
class DelayModel:
    def __init__(self) -> None:
        # Hızlı boot için diskten yüklemeyi dene
        if MODEL_FILE.exists():
            try:
                state = load(MODEL_FILE)
                self.reg = state["reg"]
                self.clf = state["clf"]
                self.mae = state["mae"]
                self.rmse = state["rmse"]
                self.auc = state["auc"]
                self.precision = state.get("precision", 0.0)
                self.recall = state.get("recall", 0.0)
                self.f1 = state.get("f1", 0.0)
                self.cm = state.get("cm", {"tp": 0, "fp": 0, "tn": 0, "fn": 0})
                self.importances = state["importances"]
                self.n_train = state["n_train"]
                self.n_test = state["n_test"]
                self.source = state["source"] + " · cached"
                print(
                    f"[ml] Disk: {self.source}  ·  MAE={self.mae} dk  ·  AUC={self.auc}"
                )
                return
            except Exception as e:
                print(f"[ml] Cache yüklenemedi: {e} — yeniden eğitiliyor")

        X, y, source = _load_data()
        self.source = source

        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=0.25, random_state=0
        )

        self.reg = RandomForestRegressor(
            n_estimators=100,
            max_depth=18,
            min_samples_leaf=20,
            random_state=0,
            n_jobs=-1,
        ).fit(X_tr, y_tr)

        y_tr_cls = (y_tr > DELAY_THRESHOLD).astype(int)
        self.clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=18,
            min_samples_leaf=20,
            class_weight="balanced",
            random_state=0,
            n_jobs=-1,
        ).fit(X_tr, y_tr_cls)

        pred = self.reg.predict(X_te)
        self.mae = round(float(mean_absolute_error(y_te, pred)), 1)
        self.rmse = round(float(root_mean_squared_error(y_te, pred)), 1)
        y_te_cls = (y_te > DELAY_THRESHOLD).astype(int)
        if 0 < y_te_cls.sum() < len(y_te_cls):
            proba = self.clf.predict_proba(X_te)[:, 1]
            pred_cls = self.clf.predict(X_te)
            self.auc = round(float(roc_auc_score(y_te_cls, proba)), 3)
            self.precision = round(float(precision_score(y_te_cls, pred_cls, zero_division=0)), 3)
            self.recall = round(float(recall_score(y_te_cls, pred_cls, zero_division=0)), 3)
            self.f1 = round(float(f1_score(y_te_cls, pred_cls, zero_division=0)), 3)
            cm = confusion_matrix(y_te_cls, pred_cls, labels=[0, 1])
            self.cm = {
                "tn": int(cm[0, 0]),
                "fp": int(cm[0, 1]),
                "fn": int(cm[1, 0]),
                "tp": int(cm[1, 1]),
            }
        else:
            self.auc = 0.5
            self.precision = self.recall = self.f1 = 0.0
            self.cm = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}

        self.importances = {
            f: round(float(v), 3)
            for f, v in zip(ALL_FEATURES, self.reg.feature_importances_)
        }
        self.n_train = int(len(X_tr))
        self.n_test = int(len(X_te))

        # Diske kaydet
        try:
            dump(
                {
                    "reg": self.reg,
                    "clf": self.clf,
                    "mae": self.mae,
                    "rmse": self.rmse,
                    "auc": self.auc,
                    "precision": self.precision,
                    "recall": self.recall,
                    "f1": self.f1,
                    "cm": self.cm,
                    "importances": self.importances,
                    "n_train": self.n_train,
                    "n_test": self.n_test,
                    "source": self.source,
                },
                MODEL_FILE,
                compress=3,
            )
            print(f"[ml] Model diske kaydedildi: {MODEL_FILE.name}")
        except Exception as e:
            print(f"[ml] Disk kaydı başarısız: {e}")

        print(f"[ml] Veri: {source}  ·  MAE={self.mae} dk  ·  AUC={self.auc}")

    def predict(self, hour: int, load: float, haul: float, weather: float):
        """Public 4-özellik arayüzü — diğer 5 sinyal 0 alınır."""
        weather_min = weather * 90  # 0-1 → 0-90 dk geri çevir
        x = [[hour, load, haul, weather, weather_min, 0.0, 0.0, 3, 6]]
        minutes = max(0, round(float(self.reg.predict(x)[0])))
        prob = float(self.clf.predict_proba(x)[0][1])
        return prob, minutes

    def explain(self, hour: int, load: float, haul: float, weather: float):
        """SHAP yerine ağaç tabanlı yerel öz katkılar.

        Her ağacın her özellik için tahmine katkısı: (yaprak değeri − kök ortalaması)
        ortalamasını basit bir yaklaşımla, **feature_importances × normalize(input)**
        ile yaklaştırıyoruz. Tam SHAP değil ama "neden bu tahmin?" sorusuna
        açıklanabilir bir cevap verir.
        """
        # Normalize edilmiş girdiler (0-1 ölçeği)
        normalized = {
            "departureHour": hour / 24,
            "loadFactor": load,
            "routeHaulHours": min(haul / 14, 1),
            "weatherSeverity": weather,
        }
        # importance × normalized değer = göreli yerel katkı
        contribs = []
        for name in ["departureHour", "loadFactor", "routeHaulHours", "weatherSeverity"]:
            imp = self.importances.get(name, 0)
            val = normalized.get(name, 0)
            contribs.append((name, imp * val))
        total = sum(abs(c) for _, c in contribs) or 1
        return sorted(
            [
                {"feature": n, "contribution": round(c / total, 3), "input": round(normalized[n], 3)}
                for n, c in contribs
            ],
            key=lambda x: -abs(x["contribution"]),
        )


MODEL = DelayModel()

"""Hafif ve hızlı model explainer — SHAP yerine.

Kimlik: Decision-path + feature importance + partial dependence (yaklaştırma)
Avantajları:
  - SHAP gibi 200MB+ paket yok
  - Pure NumPy/scikit-learn features kullanıyor
  - Her tahmin için <5ms
  - Offline & fast, gerçek zamanlı API'de kullanılabilir
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass
class ExplanationFeature:
    """Bir özelliğin tahmine katkısı."""

    name: str
    value: float  # normalize edilmiş input (0-1)
    importance: float  # global feature importance
    contribution: float  # local katkı (feature importance × normalized value)
    direction: str  # "↑ arttırıyor" veya "↓ azaltıyor"


@dataclass
class ModelExplanation:
    """Tahmine ait açıklama."""

    prediction: float  # tahmini gecikme dakika
    probability: float  # gecikme olasılığı (0-1)
    features: list[ExplanationFeature]  # sıralanmış katkı
    top_factor: str  # en etkili faktör
    band: str  # "Yüksek" / "Orta" / "Düşük"
    insight: str  # insan tarafından okunabilir açıklama


class LocalExplainer:
    """Scikit-learn RandomForest modelleri için hafif explainer."""

    def __init__(self, model_reg, model_clf, feature_importances: dict[str, float], delay_threshold: float = 30):
        """
        Args:
            model_reg: Fitted RandomForestRegressor (gecikme tahmini dakika)
            model_clf: Fitted RandomForestClassifier (gecikme olasılığı)
            feature_importances: Global feature importance dict (feature_name -> importance)
            delay_threshold: Gecikme sınırı (dakika)
        """
        self.model_reg = model_reg
        self.model_clf = model_clf
        self.importances = feature_importances
        self.threshold = delay_threshold

    def explain(
        self,
        hour: int,
        load: float,
        haul: float,
        weather: float,
    ) -> ModelExplanation:
        """Tahmine ait açıklaması ile ModelExplanation döndür."""

        # Tahmin
        x = np.array([[hour, load, haul, weather, weather * 90, 0.0, 0.0, 3, 6]])
        pred_minutes = float(self.model_reg.predict(x)[0])
        pred_minutes = max(0, pred_minutes)
        prob = float(self.model_clf.predict_proba(x)[0][1])
        band = "Yüksek" if prob >= 0.6 else "Orta" if prob >= 0.35 else "Düşük"

        # Feature katkıları
        feature_names = ["departureHour", "loadFactor", "routeHaulHours", "weatherSeverity"]
        normalized_vals = {
            "departureHour": hour / 24.0,
            "loadFactor": load,
            "routeHaulHours": min(haul / 14.0, 1.0),
            "weatherSeverity": weather,
        }

        # Decision path analizi (ağaç derinliğinden sampling)
        tree_contrib = self._tree_path_contribution(x, feature_names)

        # Combine importance + tree path
        features_expl = []
        for name in feature_names:
            imp = self.importances.get(name, 0.0)
            norm_val = normalized_vals[name]
            tree_val = tree_contrib.get(name, 0.0)

            # Weighted blend: 70% importance-based, 30% tree-path
            contrib = 0.7 * (imp * norm_val) + 0.3 * tree_val
            direction = "↑ arttırıyor" if contrib > 0 else "↓ azaltıyor" if contrib < 0 else "→ etkisiz"

            features_expl.append(
                ExplanationFeature(
                    name=name,
                    value=round(norm_val, 3),
                    importance=round(imp, 4),
                    contribution=round(abs(contrib), 4),
                    direction=direction,
                )
            )

        # Sırala: katkı büyüklüğüne göre
        features_expl.sort(key=lambda f: f.contribution, reverse=True)

        top_factor = features_expl[0].name if features_expl else "unknown"

        # İnsan tarafından okunabilir insight
        insight = self._generate_insight(
            hour, load, haul, weather, pred_minutes, prob, top_factor
        )

        return ModelExplanation(
            prediction=round(pred_minutes, 1),
            probability=round(prob, 3),
            features=features_expl,
            top_factor=top_factor,
            band=band,
            insight=insight,
        )

    def _tree_path_contribution(self, x: np.ndarray, feature_names: list[str]) -> dict[str, float]:
        """Karar ağacı path'leri aracılığıyla local feature contributions hesapla.

        Basit tahmin: ağacın derinliğine bağlı olarak, kullanılan özeliklerin
        tahmine katkısını yapraklardan geriye doğru izle.

        SHAP'ın yerine, hızlı yaklaştırma.
        """
        contribs = {name: 0.0 for name in feature_names}

        for tree in self.model_reg.estimators_[:10]:  # İlk 10 ağacı örnek al
            node_indicator = tree.decision_path(x).toarray()[0]
            node_ids = np.where(node_indicator)[0]

            for node_id in node_ids[:-1]:  # Son node (yaprak) hariç
                if hasattr(tree.tree_, "feature") and tree.tree_.feature[node_id] >= 0:
                    feat_idx = tree.tree_.feature[node_id]
                    if feat_idx < len(feature_names):
                        # Değer: threshold'a ne kadar yakın olduğu
                        threshold = tree.tree_.threshold[node_id]
                        value = x[0, feat_idx] if feat_idx < x.shape[1] else 0.0
                        contribs[feature_names[feat_idx]] += (value - threshold) * 0.01

        # Normalize
        total = sum(abs(v) for v in contribs.values()) or 1
        return {k: v / total for k, v in contribs.items()}

    def _generate_insight(
        self, hour: int, load: float, haul: float, weather: float, pred_min: float, prob: float, top_factor: str
    ) -> str:
        """İnsan tarafından okunabilir insight."""

        time_str = (
            "Sabah rush saat" if 6 <= hour <= 9 else "Akşam peak saati" if 16 <= hour <= 21 else "Off-peak saat"
        )
        load_str = "Yüksek yoğunluk" if load > 0.8 else "Orta yoğunluk" if load > 0.65 else "Düşük yoğunluk"
        haul_str = "Uzun rota" if haul > 8 else "Orta rota" if haul > 4 else "Kısa rota"
        weather_str = "Olumsuz hava" if weather > 0.5 else "Normal hava"

        base = f"{time_str} ({hour}:00), {load_str} ({load:.0%}), {haul_str} ({haul:.1f}h), {weather_str} ({weather:.0%})"

        if top_factor == "weatherSeverity":
            reason = "Hava şartları tahmini en çok etkiliyor."
        elif top_factor == "departureHour":
            reason = "Kalkış saati gecikme riskini belirliyei."
        elif top_factor == "loadFactor":
            reason = "Uçak doluluğu işleme ve boarding süresini etkiliyor."
        elif top_factor == "routeHaulHours":
            reason = "Rota uzunluğu operasyonel kompleksiteyi artırıyor."
        else:
            reason = "Çeşitli faktörler etkili."

        forecast_str = f"Ortalama ~{pred_min:.0f} dk gecikme ({prob:.0%} olasılık, {('Yüksek' if prob >= 0.6 else 'Orta' if prob >= 0.35 else 'Düşük')} risk)."

        return f"{base}. {reason} {forecast_str}"

    def partial_dependence_summary(self, feature_name: str, num_samples: int = 5) -> list[dict]:
        """Bir özelliğin çıkış üzerindeki etkisini görsel olarak özetleyen örnekler."""
        if feature_name == "departureHour":
            vals = np.linspace(0, 23, num_samples)
        elif feature_name == "loadFactor":
            vals = np.linspace(0.5, 1.0, num_samples)
        elif feature_name == "routeHaulHours":
            vals = np.linspace(1, 14, num_samples)
        elif feature_name == "weatherSeverity":
            vals = np.linspace(0, 1, num_samples)
        else:
            return []

        base_x = np.array([[12, 0.7, 6, 0.3, 30, 0, 0, 3, 6]])  # reference
        results = []
        for val in vals:
            x_mod = base_x.copy()
            if feature_name == "departureHour":
                x_mod[0, 0] = val
            elif feature_name == "loadFactor":
                x_mod[0, 1] = val
            elif feature_name == "routeHaulHours":
                x_mod[0, 2] = val
            elif feature_name == "weatherSeverity":
                x_mod[0, 3] = val

            pred_min = float(self.model_reg.predict(x_mod)[0])
            pred_min = max(0, pred_min)
            prob = float(self.model_clf.predict_proba(x_mod)[0][1])

            results.append({
                "feature_value": round(val, 2),
                "prediction_min": round(pred_min, 1),
                "probability": round(prob, 3)
            })

        return results

import numpy as np
from sklearn.ensemble import IsolationForest
import logging

logger = logging.getLogger(__name__)

class SecurityAnomalyDetector:
    """
    Machine Learning Anomaly Detector using Scikit-Learn's Isolation Forest.
    Trained on baseline feature distributions of normalized SOC telemetry.
    """
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,  # Expect ~10% anomalous security outliers
            random_state=42
        )
        self._is_fitted = False
        self._fit_baseline_model()

    def _extract_features(self, rule_level: int, recent_count: int, is_external: bool, 
                          has_mitre: bool, has_auth_fail: bool, has_malware: bool, has_shell: bool) -> np.ndarray:
        return np.array([
            rule_level,
            recent_count,
            1.0 if is_external else 0.0,
            1.0 if has_mitre else 0.0,
            1.0 if has_auth_fail else 0.0,
            1.0 if has_malware else 0.0,
            1.0 if has_shell else 0.0
        ])

    def _fit_baseline_model(self):
        """Fit baseline model on synthesized nominal security event feature distributions."""
        np.random.seed(42)
        n_samples = 500

        # Normal typical events (low rule levels, low frequency, internal traffic)
        normal_rule_levels = np.random.choice([2, 3, 4, 5, 6], size=n_samples, p=[0.3, 0.3, 0.2, 0.15, 0.05])
        normal_frequencies = np.random.poisson(lam=1.5, size=n_samples)
        normal_is_external = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
        normal_has_mitre = np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15])
        normal_auth_fail = np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1])
        normal_malware = np.zeros(n_samples)
        normal_shell = np.random.choice([0, 1], size=n_samples, p=[0.95, 0.05])

        X_normal = np.column_stack([
            normal_rule_levels,
            normal_frequencies,
            normal_is_external,
            normal_has_mitre,
            normal_auth_fail,
            normal_malware,
            normal_shell
        ])

        # Anomalous outliers (high rule levels, high volume spikes, external Tor, malware payloads)
        n_anom = 50
        anom_rule_levels = np.random.choice([10, 12, 14, 15], size=n_anom)
        anom_frequencies = np.random.randint(15, 80, size=n_anom)
        anom_is_external = np.ones(n_anom)
        anom_has_mitre = np.ones(n_anom)
        anom_auth_fail = np.random.choice([0, 1], size=n_anom, p=[0.3, 0.7])
        anom_malware = np.random.choice([0, 1], size=n_anom, p=[0.4, 0.6])
        anom_shell = np.random.choice([0, 1], size=n_anom, p=[0.3, 0.7])

        X_anom = np.column_stack([
            anom_rule_levels,
            anom_frequencies,
            anom_is_external,
            anom_has_mitre,
            anom_auth_fail,
            anom_malware,
            anom_shell
        ])

        X_train = np.vstack([X_normal, X_anom])
        self.model.fit(X_train)
        self._is_fitted = True
        logger.info("SecurityAnomalyDetector Isolation Forest model successfully fitted on baseline telemetry.")

    def predict_anomaly(self, rule_level: int, recent_count: int, is_external: bool,
                        has_mitre: bool, has_auth_fail: bool, has_malware: bool, has_shell: bool):
        """
        Returns:
            is_anomaly (bool): True if Isolation Forest marks event as outlier (-1)
            anomaly_score (float): Normalized decision function score between 0.0 and 1.0
        """
        features = self._extract_features(
            rule_level, recent_count, is_external, has_mitre, has_auth_fail, has_malware, has_shell
        ).reshape(1, -1)

        prediction = self.model.predict(features)[0]  # -1 = anomaly, 1 = normal
        raw_score = self.model.decision_function(features)[0]  # lower = more abnormal

        # Normalize score: lower raw_score means higher anomaly probability
        # decision_function typically ranges [-0.5, 0.5]
        anomaly_prob = float(np.clip(1.0 - (raw_score + 0.3) / 0.6, 0.0, 1.0))
        is_anomaly = bool(prediction == -1 or anomaly_prob > 0.65 or rule_level >= 12)

        return is_anomaly, round(anomaly_prob, 3)

detector = SecurityAnomalyDetector()

import pytest
from app.models.anomaly_detector import detector
from app.services.analysis_service import analysis_service
from app.schemas.alert_schemas import AlertInput

def test_anomaly_detector_baseline():
    # Nominal event
    is_anom, prob = detector.predict_anomaly(
        rule_level=3,
        recent_count=1,
        is_external=False,
        has_mitre=False,
        has_auth_fail=False,
        has_malware=False,
        has_shell=False
    )
    assert isinstance(is_anom, bool)
    assert 0.0 <= prob <= 1.0

def test_alert_analysis_service():
    alert = AlertInput(
        rule_level=12,
        rule_description="Possible SQL Injection in HTTP URI",
        rule_groups=["web", "attack"],
        agent_id="001",
        agent_name="web-server-01",
        source_ip="194.26.29.112",
        mitre_techniques=["Exploit Public-Facing Application"],
        recent_count=5
    )
    result = analysis_service.analyze_alert(alert)
    assert result.risk_score >= 50
    assert result.severity in ["high", "critical"]
    assert len(result.recommended_actions) > 0

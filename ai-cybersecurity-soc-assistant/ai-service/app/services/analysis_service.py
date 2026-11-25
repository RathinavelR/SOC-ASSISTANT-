import os
import logging
from typing import Dict, Any, List
from app.schemas.alert_schemas import AlertInput, AnalysisOutput, SummarizeRequest, SummarizeOutput
from app.models.anomaly_detector import detector

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model_name = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
        self._openai_client = None

        if self.openai_key:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=self.openai_key)
                logger.info("OpenAI LLM client initialized for advisory cybersecurity reasoning.")
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI client: {e}")

    def analyze_alert(self, alert: AlertInput) -> AnalysisOutput:
        # 1. Feature extraction for ML model
        desc_lower = (alert.rule_description or "").lower()
        groups_lower = [g.lower() for g in alert.rule_groups]
        is_external = bool(alert.source_ip and not self._is_private_ip(alert.source_ip))
        has_mitre = bool(len(alert.mitre_techniques) > 0)
        has_auth_fail = "auth" in desc_lower or "failed password" in desc_lower or "authentication_failed" in groups_lower
        has_malware = "malware" in desc_lower or "ransomware" in desc_lower or "trojan" in desc_lower
        has_shell = "powershell" in desc_lower or "cmd.exe" in desc_lower or "bash" in desc_lower or "shell" in desc_lower

        # 2. Run Isolation Forest ML model
        is_anomaly, anomaly_prob = detector.predict_anomaly(
            rule_level=alert.rule_level,
            recent_count=alert.recent_count,
            is_external=is_external,
            has_mitre=has_mitre,
            has_auth_fail=has_auth_fail,
            has_malware=has_malware,
            has_shell=has_shell
        )

        # 3. Calculate Risk Score
        threat_intel_bonus = 0
        if alert.threat_intel:
            rep = alert.threat_intel.get("reputation", "")
            abuse_score = alert.threat_intel.get("abuseScore", 0)
            if rep == "malicious" or abuse_score > 75:
                threat_intel_bonus = 25
            elif rep == "suspicious" or abuse_score > 25:
                threat_intel_bonus = 12

        base_score = int((alert.rule_level / 15.0) * 40)
        freq_score = min(20, alert.recent_count * 3)
        pattern_score = 15 if (has_malware or has_shell or has_auth_fail) else 5
        ml_score = int(anomaly_prob * 20)

        total_risk = min(100, base_score + freq_score + pattern_score + ml_score + threat_intel_bonus)

        # 4. Determine Severity
        if total_risk >= 80:
            severity = "critical"
        elif total_risk >= 60:
            severity = "high"
        elif total_risk >= 30:
            severity = "medium"
        else:
            severity = "low"

        # 5. Threat Classification
        threat_type = self._classify_threat(desc_lower, groups_lower)

        # 6. Generate Reasoning (LLM or Rule-Based Deterministic Fallback)
        explanation = ""
        recommended_actions = []
        source_used = "ml_model"

        if self._openai_client:
            try:
                llm_exp, llm_actions = self._generate_llm_advisory(alert, total_risk, severity, threat_type)
                explanation = llm_exp
                recommended_actions = llm_actions
                source_used = "llm"
            except Exception as e:
                logger.warning(f"LLM generation failed: {e}. Reverting to local heuristic advisory.")
                explanation, recommended_actions = self._generate_heuristic_advisory(alert, total_risk, severity, threat_type)
                source_used = "hybrid"
        else:
            explanation, recommended_actions = self._generate_heuristic_advisory(alert, total_risk, severity, threat_type)
            source_used = "hybrid"

        return AnalysisOutput(
            risk_score=total_risk,
            severity=severity,
            threat_type=threat_type,
            confidence=round(0.80 + (0.15 * anomaly_prob), 2),
            anomaly=is_anomaly,
            mitre_techniques=alert.mitre_techniques if alert.mitre_techniques else [self._infer_mitre(threat_type)],
            explanation=explanation,
            recommended_actions=recommended_actions,
            source=source_used
        )

    def summarize_incident(self, request: SummarizeRequest) -> SummarizeOutput:
        alert_count = len(request.alerts)
        summary = f"Incident '{request.title}' encompasses {alert_count} correlated alerts detected across monitored endpoints."
        executive_brief = f"High priority incident requiring immediate SOC triage. Evidence indicates focused activity against target assets with potential lateral movement risk."
        hypothesis = "Attacker likely achieved initial reconnaissance/access and attempted privilege escalation or credential harvesting."
        containment = [
            "Isolate affected host(s) from internal subnet via local firewall or EDR agent.",
            "Revoke active session tokens and force password resets for involved accounts.",
            "Block external source IP addresses at border router/firewalls."
        ]

        if self._openai_client:
            try:
                prompt = f"""You are a Lead SOC Analyst. Summarize this incident:
Title: {request.title}
Alerts count: {alert_count}
Alert descriptions: {[a.get('ruleDescription') or a.get('rule_description') for a in request.alerts[:5]]}
Notes: {request.notes}

Return concise, professional analysis."""
                response = self._openai_client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                summary = response.choices[0].message.content
            except Exception as e:
                logger.warning(f"LLM incident summary failed: {e}")

        return SummarizeOutput(
            summary=summary,
            executive_brief=executive_brief,
            attack_chain_hypothesis=hypothesis,
            immediate_containment_steps=containment
        )

    def _is_private_ip(self, ip: str) -> bool:
        if not ip:
            return True
        return (
            ip.startswith("10.") or
            ip.startswith("192.168.") or
            ip.startswith("127.") or
            (ip.startswith("172.") and 16 <= int(ip.split(".")[1] or 0) <= 31)
        )

    def _classify_threat(self, desc: str, groups: List[str]) -> str:
        if "ssh" in desc or "failed password" in desc or "authentication_failed" in groups:
            return "Credential Brute Force / SSH Guessing"
        if "sql" in desc or "injection" in desc or "xss" in desc:
            return "Web Application Exploit (Injection)"
        if "syscheck" in groups or "file modified" in desc or "fim" in groups:
            return "Unauthorized File Integrity Tampering"
        if "powershell" in desc or "encoded" in desc:
            return "Obfuscated PowerShell / Process Execution"
        if "nmap" in desc or "port scan" in desc:
            return "Network Reconnaissance / Port Scan"
        if "privilege" in desc or "sudo" in desc:
            return "Privilege Escalation Attempt"
        return "Anomalous Endpoint Behavior"

    def _infer_mitre(self, threat_type: str) -> str:
        if "Brute Force" in threat_type:
            return "T1110 - Brute Force"
        if "Injection" in threat_type:
            return "T1190 - Exploit Public-Facing Application"
        if "Tampering" in threat_type:
            return "T1565 - Stored Data Manipulation"
        if "PowerShell" in threat_type:
            return "T1059.001 - PowerShell"
        if "Reconnaissance" in threat_type:
            return "T1046 - Network Service Discovery"
        return "T1204 - User Execution"

    def _generate_heuristic_advisory(self, alert: AlertInput, risk_score: int, severity: str, threat_type: str):
        agent = alert.agent_name or alert.agent_id or "monitored asset"
        src = f" originating from IP {alert.source_ip}" if alert.source_ip else ""
        desc = alert.rule_description or "Security rule trigger"
        
        explanation = (
            f"The AI Assistant triaged this security event as {severity.upper()} risk (Calculated Risk Score: {risk_score}/100). "
            f"Observed '{desc}' on {agent}{src}. ML Isolation Forest model flagged statistical divergence in frequency and rule severity weights. "
            f"This matches known '{threat_type}' behavior patterns."
        )

        actions = [
            f"Investigate active processes and logged-in sessions on agent '{agent}'.",
            "Verify whether this behavior was authorized during change management windows."
        ]
        if alert.source_ip and not self._is_private_ip(alert.source_ip):
            actions.insert(0, f"Block inbound traffic from source IP {alert.source_ip} on perimeter firewall.")
        if risk_score >= 70:
            actions.append("Consider isolating the host from the internal VLAN to prevent lateral propagation.")

        return explanation, actions

    def _generate_llm_advisory(self, alert: AlertInput, risk_score: int, severity: str, threat_type: str):
        prompt = f"""You are a Tier-3 Cybersecurity SOC Analyst AI. Provide a brief analysis of this Wazuh alert:
Rule Level: {alert.rule_level}
Description: {alert.rule_description}
Agent: {alert.agent_name} ({alert.agent_ip})
Source IP: {alert.source_ip}
Threat Intel: {alert.threat_intel}
Log: {alert.full_log}

Provide:
1. Two-sentence explanation of risk and attacker intent.
2. 3 actionable containment or investigation recommendations."""

        response = self._openai_client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250,
            temperature=0.3
        )
        content = response.choices[0].message.content or ""
        lines = [line.strip("- *").strip() for line in content.split("\n") if line.strip()]
        
        explanation = lines[0] if lines else "AI evaluation detected high-risk signature."
        actions = lines[1:4] if len(lines) > 1 else ["Inspect endpoint logs", "Verify authorization"]
        return explanation, actions

analysis_service = AnalysisService()

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AlertInput(BaseModel):
    alert_id: Optional[str] = None
    rule_id: Optional[str] = None
    rule_level: int = Field(default=0, ge=0, le=16)
    rule_description: Optional[str] = ""
    rule_groups: List[str] = Field(default_factory=list)
    agent_id: Optional[str] = ""
    agent_name: Optional[str] = ""
    source_ip: Optional[str] = ""
    destination_ip: Optional[str] = ""
    mitre_techniques: List[str] = Field(default_factory=list)
    full_log: Optional[str] = ""
    threat_intel: Optional[Dict[str, Any]] = None
    recent_count: int = Field(default=1, ge=1)

class AnalysisOutput(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    severity: str
    threat_type: str
    confidence: float
    anomaly: bool
    mitre_techniques: List[str]
    explanation: str
    recommended_actions: List[str]
    source: str = "hybrid"

class SummarizeRequest(BaseModel):
    incident_id: Optional[str] = None
    title: str
    alerts: List[Dict[str, Any]] = Field(default_factory=list)
    notes: Optional[str] = ""

class SummarizeOutput(BaseModel):
    summary: str
    executive_brief: str
    attack_chain_hypothesis: str
    immediate_containment_steps: List[str]

/**
 * Transparent Risk Scoring Engine (0 - 100)
 * Evaluates:
 * 1. Wazuh Rule Level (0 - 35 pts)
 * 2. Alert Frequency / Recent spike (0 - 15 pts)
 * 3. Source IP Reputation / Threat Intel (0 - 20 pts)
 * 4. MITRE ATT&CK Technique criticality (0 - 15 pts)
 * 5. Authentication failures / Brute force indicators (0 - 15 pts)
 */
class RiskScorer {
  calculateScore(alert, threatIntel = null, recentAlertCount = 1) {
    const factors = [];
    let score = 0;

    // 1. Wazuh Rule Level (level 0 to 15, scaled to 35)
    const ruleLevel = alert.ruleLevel || 0;
    const ruleLevelWeight = Math.min(35, Math.round((ruleLevel / 15) * 35));
    score += ruleLevelWeight;
    factors.push({
      factor: 'Wazuh Rule Level',
      weight: 35,
      value: `Level ${ruleLevel}`,
      contribution: ruleLevelWeight,
    });

    // 2. Alert Frequency (spike from same agent or IP)
    let freqWeight = 0;
    if (recentAlertCount >= 20) freqWeight = 15;
    else if (recentAlertCount >= 10) freqWeight = 10;
    else if (recentAlertCount >= 5) freqWeight = 5;
    score += freqWeight;
    factors.push({
      factor: 'Alert Frequency / Volume',
      weight: 15,
      value: `${recentAlertCount} events in recent window`,
      contribution: freqWeight,
    });

    // 3. Source IP Threat Intel Reputation
    let threatIntelWeight = 0;
    let threatIntelDesc = 'Clean / Internal';
    if (threatIntel) {
      if (threatIntel.reputation === 'malicious' || (threatIntel.abuseScore && threatIntel.abuseScore > 75)) {
        threatIntelWeight = 20;
        threatIntelDesc = `Known Malicious IP (Abuse Score: ${threatIntel.abuseScore || 'High'})`;
      } else if (threatIntel.reputation === 'suspicious' || (threatIntel.abuseScore && threatIntel.abuseScore > 25)) {
        threatIntelWeight = 10;
        threatIntelDesc = `Suspicious IP (Abuse Score: ${threatIntel.abuseScore || 'Moderate'})`;
      }
    }
    score += threatIntelWeight;
    factors.push({
      factor: 'Threat Intelligence Score',
      weight: 20,
      value: threatIntelDesc,
      contribution: threatIntelWeight,
    });

    // 4. MITRE ATT&CK Criticality
    const mitreTechniques = alert.mitre?.technique || [];
    let mitreWeight = 0;
    if (mitreTechniques.length > 0) {
      // Check for high impact tactics like Privilege Escalation, Lateral Movement, Exfiltration
      const tactics = (alert.mitre?.tactic || []).map((t) => t.toLowerCase());
      if (tactics.some((t) => t.includes('privilege') || t.includes('lateral') || t.includes('impact') || t.includes('exfiltration'))) {
        mitreWeight = 15;
      } else {
        mitreWeight = 10;
      }
    }
    score += mitreWeight;
    factors.push({
      factor: 'MITRE ATT&CK Tactics',
      weight: 15,
      value: mitreTechniques.join(', ') || 'None identified',
      contribution: mitreWeight,
    });

    // 5. Authentication Failures & Suspicious Keywords
    const desc = (alert.ruleDescription || '').toLowerCase();
    const groups = (alert.ruleGroups || []).map((g) => g.toLowerCase());
    let authWeight = 0;
    let authReason = 'Normal Event';

    if (
      groups.includes('authentication_failed') ||
      groups.includes('sshd') ||
      desc.includes('failed password') ||
      desc.includes('brute force') ||
      desc.includes('multiple failed logins')
    ) {
      authWeight = 15;
      authReason = 'Authentication Failure / Brute-force match';
    } else if (desc.includes('malware') || desc.includes('rootkit') || desc.includes('ransomware') || desc.includes('trojan')) {
      authWeight = 15;
      authReason = 'Malicious software match';
    } else if (desc.includes('command execution') || desc.includes('sql injection') || desc.includes('xss') || desc.includes('shell')) {
      authWeight = 12;
      authReason = 'Exploitation / Injection attempt';
    }
    score += authWeight;
    factors.push({
      factor: 'Attack Pattern Classification',
      weight: 15,
      value: authReason,
      contribution: authWeight,
    });

    // Clamp score to [0, 100]
    const finalScore = Math.max(0, Math.min(100, score));

    // Determine severity level based on score
    let severity = 'low';
    if (finalScore >= 80) severity = 'critical';
    else if (finalScore >= 60) severity = 'high';
    else if (finalScore >= 30) severity = 'medium';

    return {
      score: finalScore,
      severity,
      factors,
    };
  }
}

module.exports = new RiskScorer();

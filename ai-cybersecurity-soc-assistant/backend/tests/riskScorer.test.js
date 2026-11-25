const riskScorer = require('../src/services/ai/riskScorer');

describe('Risk Scoring Engine Unit Tests', () => {
  test('Low severity event should calculate score under 30', () => {
    const alert = {
      ruleLevel: 3,
      ruleDescription: 'Standard system login success',
      ruleGroups: ['syslog'],
      mitre: { technique: [] },
    };

    const result = riskScorer.calculateScore(alert, null, 1);
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.severity).toBe('low');
  });

  test('High severity event with malicious threat intel and auth failure should yield high/critical score', () => {
    const alert = {
      ruleLevel: 12,
      ruleDescription: 'sshd: Multiple failed login attempts (potential SSH brute force)',
      ruleGroups: ['sshd', 'authentication_failed'],
      mitre: { technique: ['Password Guessing'], tactic: ['Credential Access'] },
    };

    const threatIntel = {
      reputation: 'malicious',
      abuseScore: 95,
    };

    const result = riskScorer.calculateScore(alert, threatIntel, 10);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(['high', 'critical']).toContain(result.severity);
  });
});

const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

class AbuseIpDbService {
  constructor() {
    this.apiKey = config.threatIntel.abuseIpDbKey;
    this.baseUrl = 'https://api.abuseipdb.com/api/v2';
  }

  isConfigured() {
    return !!(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Check IP abuse confidence score & report history
   */
  async checkIp(ip, maxAgeInDays = 90) {
    if (!this.isConfigured()) {
      return { configured: false, message: 'AbuseIPDB API key not configured' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/check`, {
        headers: {
          Key: this.apiKey,
          Accept: 'application/json',
        },
        params: {
          ipAddress: ip,
          maxAgeInDays,
          verbose: true,
        },
        timeout: 10000,
      });

      const data = response.data?.data || {};
      const abuseScore = data.abuseConfidenceScore || 0;

      let reputation = 'clean';
      if (abuseScore >= 75) reputation = 'malicious';
      else if (abuseScore >= 25) reputation = 'suspicious';

      return {
        configured: true,
        source: 'abuseipdb',
        indicator: ip,
        indicatorType: 'ip',
        reputation,
        abuseScore,
        country: data.countryCode || data.countryName || 'Unknown',
        isp: data.isp || 'Unknown',
        domain: data.domain,
        totalReports: data.totalReports || 0,
        numDistinctUsers: data.numDistinctUsers || 0,
        lastReportedAt: data.lastReportedAt,
        isWhitelisted: data.isWhitelisted || false,
        usageType: data.usageType,
      };
    } catch (error) {
      logger.warn(`AbuseIPDB check failed for ${ip}: ${error.message}`);
      return {
        configured: true,
        source: 'abuseipdb',
        indicator: ip,
        indicatorType: 'ip',
        reputation: 'unknown',
        error: error.response?.data?.errors?.[0]?.detail || error.message,
      };
    }
  }
}

module.exports = new AbuseIpDbService();

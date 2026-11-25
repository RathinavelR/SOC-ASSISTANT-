const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

class ShodanService {
  constructor() {
    this.apiKey = config.threatIntel.shodanKey;
    this.baseUrl = 'https://api.shodan.io';
  }

  isConfigured() {
    return !!(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Search host info by IP
   */
  async lookupHost(ip) {
    if (!this.isConfigured()) {
      return { configured: false, message: 'Shodan API key not configured' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/shodan/host/${ip}`, {
        params: { key: this.apiKey },
        timeout: 10000,
      });

      const data = response.data || {};
      const ports = data.ports || [];
      const vulns = data.vulns || [];

      let reputation = 'clean';
      if (vulns.length > 0) reputation = 'suspicious';

      return {
        configured: true,
        source: 'shodan',
        indicator: ip,
        indicatorType: 'ip',
        reputation,
        country: data.country_name || 'Unknown',
        isp: data.isp || 'Unknown',
        ports,
        vulns,
        hostnames: data.hostnames || [],
        os: data.os || 'Unknown',
        org: data.org || 'Unknown',
      };
    } catch (error) {
      logger.warn(`Shodan lookup failed for ${ip}: ${error.message}`);
      return {
        configured: true,
        source: 'shodan',
        indicator: ip,
        indicatorType: 'ip',
        reputation: 'unknown',
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

module.exports = new ShodanService();

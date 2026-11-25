const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

class VirusTotalService {
  constructor() {
    this.apiKey = config.threatIntel.virusTotalKey;
    this.baseUrl = 'https://www.virustotal.com/api/v3';
  }

  isConfigured() {
    return !!(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Scan / Lookup an IP on VirusTotal
   */
  async lookupIp(ip) {
    if (!this.isConfigured()) {
      return { configured: false, message: 'VirusTotal API key not configured' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/ip_addresses/${ip}`, {
        headers: { 'x-apikey': this.apiKey },
        timeout: 10000,
      });

      const data = response.data?.data?.attributes || {};
      const stats = data.last_analysis_stats || {};
      const maliciousCount = stats.malicious || 0;
      const suspiciousCount = stats.suspicious || 0;

      let reputation = 'clean';
      if (maliciousCount >= 3) reputation = 'malicious';
      else if (maliciousCount > 0 || suspiciousCount > 1) reputation = 'suspicious';

      return {
        configured: true,
        source: 'virustotal',
        indicator: ip,
        indicatorType: 'ip',
        reputation,
        detectionCount: maliciousCount,
        totalEngines: (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0) + (stats.undetected || 0),
        maliciousReports: maliciousCount,
        country: data.country || 'Unknown',
        isp: data.as_owner || 'Unknown',
        raw: {
          network: data.network,
          reputationScore: data.reputation,
          lastAnalysisStats: stats,
        },
      };
    } catch (error) {
      logger.warn(`VirusTotal IP lookup failed for ${ip}: ${error.message}`);
      return {
        configured: true,
        source: 'virustotal',
        indicator: ip,
        indicatorType: 'ip',
        reputation: 'unknown',
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Scan / Lookup a file hash (MD5, SHA1, SHA256) on VirusTotal
   */
  async lookupHash(hash) {
    if (!this.isConfigured()) {
      return { configured: false, message: 'VirusTotal API key not configured' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/files/${hash}`, {
        headers: { 'x-apikey': this.apiKey },
        timeout: 10000,
      });

      const data = response.data?.data?.attributes || {};
      const stats = data.last_analysis_stats || {};
      const maliciousCount = stats.malicious || 0;

      let reputation = 'clean';
      if (maliciousCount >= 5) reputation = 'malicious';
      else if (maliciousCount > 0) reputation = 'suspicious';

      return {
        configured: true,
        source: 'virustotal',
        indicator: hash,
        indicatorType: 'hash',
        reputation,
        detectionCount: maliciousCount,
        totalEngines: (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0) + (stats.undetected || 0),
        maliciousReports: maliciousCount,
        meaningfulName: data.meaningful_name || data.type_description || 'Unknown file',
        typeDescription: data.type_description,
        names: (data.names || []).slice(0, 5),
        raw: {
          lastAnalysisStats: stats,
          size: data.size,
          typeExtension: data.type_extension,
        },
      };
    } catch (error) {
      logger.warn(`VirusTotal hash lookup failed for ${hash}: ${error.message}`);
      return {
        configured: true,
        source: 'virustotal',
        indicator: hash,
        indicatorType: 'hash',
        reputation: 'unknown',
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}

module.exports = new VirusTotalService();

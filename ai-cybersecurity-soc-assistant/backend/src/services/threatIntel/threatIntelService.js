const { ThreatIntelResult } = require('../../models');
const virusTotalService = require('./virusTotalService');
const abuseIpDbService = require('./abuseIpDbService');
const shodanService = require('./shodanService');
const logger = require('../../utils/logger');

class ThreatIntelService {
  /**
   * Helper to check if IP is private/loopback/bogus
   */
  isPrivateIp(ip) {
    if (!ip) return true;
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    // 127.0.0.1 (localhost)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0
    if (parts[0] === 0) return true;
    return false;
  }

  /**
   * Enrich an IP address across all configured threat intelligence engines.
   * Caches results in MongoDB with a 24-hour TTL.
   */
  async enrichIp(ip) {
    if (!ip || this.isPrivateIp(ip)) {
      return {
        indicator: ip,
        indicatorType: 'ip',
        isPrivate: true,
        reputation: 'clean',
        sources: {},
        summary: 'Internal / Private IP address',
      };
    }

    const cached = await ThreatIntelResult.find({
      indicator: ip,
      ttl: { $gt: new Date() },
    });

    const results = {};
    const sourcesToFetch = [];

    // Check VirusTotal cache
    const vtCached = cached.find((c) => c.source === 'virustotal');
    if (vtCached) {
      results.virustotal = vtCached;
    } else if (virusTotalService.isConfigured()) {
      sourcesToFetch.push(
        virusTotalService.lookupIp(ip).then(async (res) => {
          if (res.configured && !res.error) {
            const saved = await this.saveCache(res);
            results.virustotal = saved;
          } else {
            results.virustotal = res;
          }
        })
      );
    }

    // Check AbuseIPDB cache
    const abuseCached = cached.find((c) => c.source === 'abuseipdb');
    if (abuseCached) {
      results.abuseipdb = abuseCached;
    } else if (abuseIpDbService.isConfigured()) {
      sourcesToFetch.push(
        abuseIpDbService.checkIp(ip).then(async (res) => {
          if (res.configured && !res.error) {
            const saved = await this.saveCache(res);
            results.abuseipdb = saved;
          } else {
            results.abuseipdb = res;
          }
        })
      );
    }

    // Check Shodan cache
    const shodanCached = cached.find((c) => c.source === 'shodan');
    if (shodanCached) {
      results.shodan = shodanCached;
    } else if (shodanService.isConfigured()) {
      sourcesToFetch.push(
        shodanService.lookupHost(ip).then(async (res) => {
          if (res.configured && !res.error) {
            const saved = await this.saveCache(res);
            results.shodan = saved;
          } else {
            results.shodan = res;
          }
        })
      );
    }

    await Promise.allSettled(sourcesToFetch);

    // Compute consolidated reputation
    let overallReputation = 'clean';
    let maxAbuseScore = 0;
    let country = 'Unknown';
    let isp = 'Unknown';

    if (results.abuseipdb) {
      if (results.abuseipdb.abuseScore > maxAbuseScore) {
        maxAbuseScore = results.abuseipdb.abuseScore;
      }
      if (results.abuseipdb.country) country = results.abuseipdb.country;
      if (results.abuseipdb.isp) isp = results.abuseipdb.isp;
      if (results.abuseipdb.reputation === 'malicious') overallReputation = 'malicious';
      else if (results.abuseipdb.reputation === 'suspicious' && overallReputation !== 'malicious') {
        overallReputation = 'suspicious';
      }
    }

    if (results.virustotal) {
      if (results.virustotal.country && country === 'Unknown') country = results.virustotal.country;
      if (results.virustotal.isp && isp === 'Unknown') isp = results.virustotal.isp;
      if (results.virustotal.reputation === 'malicious') overallReputation = 'malicious';
      else if (results.virustotal.reputation === 'suspicious' && overallReputation !== 'malicious') {
        overallReputation = 'suspicious';
      }
    }

    return {
      indicator: ip,
      indicatorType: 'ip',
      isPrivate: false,
      reputation: overallReputation,
      abuseScore: maxAbuseScore,
      country,
      isp,
      sources: results,
      lastChecked: new Date(),
    };
  }

  /**
   * Enrich a file hash via VirusTotal
   */
  async enrichHash(hash) {
    if (!hash) return null;

    const cached = await ThreatIntelResult.findOne({
      indicator: hash,
      source: 'virustotal',
      ttl: { $gt: new Date() },
    });

    if (cached) {
      return {
        indicator: hash,
        indicatorType: 'hash',
        reputation: cached.reputation,
        sources: { virustotal: cached },
      };
    }

    const vtRes = await virusTotalService.lookupHash(hash);
    if (vtRes.configured && !vtRes.error) {
      const saved = await this.saveCache(vtRes);
      return {
        indicator: hash,
        indicatorType: 'hash',
        reputation: saved.reputation,
        sources: { virustotal: saved },
      };
    }

    return {
      indicator: hash,
      indicatorType: 'hash',
      reputation: vtRes.reputation || 'unknown',
      sources: { virustotal: vtRes },
    };
  }

  async saveCache(data) {
    try {
      const ttlDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr TTL
      const updateData = {
        indicator: data.indicator,
        indicatorType: data.indicatorType,
        source: data.source,
        result: data.raw || data,
        reputation: data.reputation || 'unknown',
        abuseScore: data.abuseScore,
        country: data.country,
        isp: data.isp,
        detectionCount: data.detectionCount || 0,
        totalEngines: data.totalEngines || 0,
        maliciousReports: data.maliciousReports || data.totalReports || 0,
        lastChecked: new Date(),
        ttl: ttlDate,
      };

      const doc = await ThreatIntelResult.findOneAndUpdate(
        { indicator: data.indicator, source: data.source },
        updateData,
        { upsert: true, new: true }
      );
      return doc;
    } catch (err) {
      logger.error(`Error saving threat intel cache: ${err.message}`);
      return data;
    }
  }
}

module.exports = new ThreatIntelService();

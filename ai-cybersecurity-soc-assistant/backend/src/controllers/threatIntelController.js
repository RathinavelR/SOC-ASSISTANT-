const threatIntelService = require('../services/threatIntel/threatIntelService');
const { ThreatIntelResult } = require('../models');

exports.getIpIntel = async (req, res, next) => {
  try {
    const ip = req.params.ip;
    const intel = await threatIntelService.enrichIp(ip);
    res.json({
      success: true,
      data: intel,
    });
  } catch (error) {
    next(error);
  }
};

exports.getHashIntel = async (req, res, next) => {
  try {
    const hash = req.params.hash;
    const intel = await threatIntelService.enrichHash(hash);
    res.json({
      success: true,
      data: intel,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentLookups = async (req, res, next) => {
  try {
    const recent = await ThreatIntelResult.find()
      .sort({ lastChecked: -1 })
      .limit(30);

    res.json({
      success: true,
      data: recent,
    });
  } catch (error) {
    next(error);
  }
};

const express = require('express');
const router = express.Router();
const threatIntelController = require('../controllers/threatIntelController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/ip/:ip', threatIntelController.getIpIntel);
router.get('/hash/:hash', threatIntelController.getHashIntel);
router.get('/recent', threatIntelController.getRecentLookups);

module.exports = router;

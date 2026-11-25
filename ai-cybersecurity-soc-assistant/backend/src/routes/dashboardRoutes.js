const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/trends', dashboardController.getTrends);
router.get('/severity', dashboardController.getSeverityDistribution);
router.get('/top-threats', dashboardController.getTopThreats);

module.exports = router;

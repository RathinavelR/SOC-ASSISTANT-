const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/analyze', aiController.analyzeTextOrAlert);
router.get('/insights', aiController.getAiInsights);
router.post('/calculate-risk', aiController.calculateRisk);

module.exports = router;

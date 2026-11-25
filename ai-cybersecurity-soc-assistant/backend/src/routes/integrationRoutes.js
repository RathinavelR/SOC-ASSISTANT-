const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// Wazuh custom integrator webhook - unauthenticated by user token, verified by X-Wazuh-Integration-Secret
router.post('/wazuh/alert', integrationController.receiveWazuhWebhook);

module.exports = router;

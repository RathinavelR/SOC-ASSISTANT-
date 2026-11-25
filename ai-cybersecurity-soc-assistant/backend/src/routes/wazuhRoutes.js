const express = require('express');
const router = express.Router();
const wazuhController = require('../controllers/wazuhController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/status', wazuhController.getStatus);
router.get('/agents', wazuhController.getAgents);
router.get('/agents/:id', wazuhController.getAgentById);
router.get('/agents/:id/syscollector', wazuhController.getAgentSyscollector);
router.get('/agents/:id/fim', wazuhController.getAgentFim);
router.get('/agents/:id/sca', wazuhController.getAgentSca);
router.get('/manager', wazuhController.getManagerInfo);
router.get('/rules', wazuhController.getRules);
router.get('/mitre', wazuhController.getMitre);

module.exports = router;

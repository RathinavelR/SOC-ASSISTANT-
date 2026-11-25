const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.getOverallHealth);
router.get('/db', healthController.getDbHealth);
router.get('/ai', healthController.getAiHealth);

module.exports = router;

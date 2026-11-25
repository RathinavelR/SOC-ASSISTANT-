const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, updateAlertSchema, alertQuerySchema } = require('../middleware/validate');

router.use(authenticate);

router.get('/', validate(alertQuerySchema, 'query'), alertController.getAlerts);
router.get('/:id', alertController.getAlertById);
router.patch('/:id', authorize('ADMIN', 'SOC_ANALYST'), validate(updateAlertSchema), alertController.updateAlert);
router.post('/:id/analyze', authorize('ADMIN', 'SOC_ANALYST'), alertController.reAnalyzeAlert);

module.exports = router;

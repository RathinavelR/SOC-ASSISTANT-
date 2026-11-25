const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', reportController.getReports);
router.post('/', authorize('ADMIN', 'SOC_ANALYST'), reportController.generateReport);
router.get('/:id', reportController.getReportById);

module.exports = router;

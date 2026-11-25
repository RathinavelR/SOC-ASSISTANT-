const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.patch('/', authorize('ADMIN'), settingsController.updateSettings);
router.get('/audit-logs', authorize('ADMIN', 'SOC_ANALYST'), settingsController.getAuditLogs);
router.get('/users', authorize('ADMIN'), settingsController.getUsers);
router.patch('/users/:id/role', authorize('ADMIN'), settingsController.updateUserRole);

module.exports = router;

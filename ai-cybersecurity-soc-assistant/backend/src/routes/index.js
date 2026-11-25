const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const wazuhRoutes = require('./wazuhRoutes');
const alertRoutes = require('./alertRoutes');
const incidentRoutes = require('./incidentRoutes');
const threatIntelRoutes = require('./threatIntelRoutes');
const aiRoutes = require('./aiRoutes');
const reportRoutes = require('./reportRoutes');
const settingsRoutes = require('./settingsRoutes');
const integrationRoutes = require('./integrationRoutes');
const healthRoutes = require('./healthRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/wazuh', wazuhRoutes);
router.use('/alerts', alertRoutes);
router.use('/incidents', incidentRoutes);
router.use('/threat-intel', threatIntelRoutes);
router.use('/ai', aiRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/integrations', integrationRoutes);
router.use('/health', healthRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

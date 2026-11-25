const http = require('http');
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const { initSocketIO } = require('./sockets/socketManager');
const notificationService = require('./services/notifications/notificationService');
const wazuhPoller = require('./services/wazuh/wazuhPoller');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketIO(server);
notificationService.setSocketIo(io);
wazuhPoller.setSocketIo(io);

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start Wazuh Background Poller / Demo Worker
    wazuhPoller.start();

    // 3. Start Listening
    server.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(`🛡️  AI Cybersecurity SOC Assistant Backend running`);
      logger.info(`🚀 Listening on http://localhost:${config.port}`);
      logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
      logger.info(`⚡ Socket.IO listening on port ${config.port}`);
      logger.info(`⚙️  Wazuh Mode: ${config.wazuh.mode} | Demo Mode: ${config.demoMode}`);
      logger.info(`=======================================================`);
    });
  } catch (err) {
    logger.error(`Fatal server initialization error: ${err.message}`);
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  wazuhPoller.stop();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

let ioInstance = null;

const initSocketIO = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Optional socket authentication
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        socket.user = decoded;
      } catch (err) {
        logger.warn(`Socket authentication failed: ${err.message}`);
      }
    }
    next();
  });

  ioInstance.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id} (User: ${socket.user?.email || 'Anonymous'})`);

    socket.on('join_room', (room) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return ioInstance;
};

module.exports = { initSocketIO, getIO };

'use strict';

/**
 * server.js
 *
 * HTTP server boot. Imports the app from app.js and starts listening.
 * Handles graceful shutdown on SIGTERM/SIGINT.
 */

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`ATLAS API server started`, {
    port: PORT,
    env: config.NODE_ENV,
    url: `http://localhost:${PORT}`,
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  // Force exit if shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejections ──────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = server;

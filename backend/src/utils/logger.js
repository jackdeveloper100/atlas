'use strict';

/**
 * utils/logger.js
 *
 * Simple structured logger. Wraps console with log levels and
 * ISO timestamps. Replace with a proper logger (pino, winston) in
 * production if needed — nothing else in the codebase should call
 * console.log directly.
 */

const config = require('../config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = config.isDevelopment() ? LEVELS.debug : LEVELS.info;

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  error(message, meta) {
    if (currentLevel >= LEVELS.error) console.error(format('error', message, meta));
  },
  warn(message, meta) {
    if (currentLevel >= LEVELS.warn) console.warn(format('warn', message, meta));
  },
  info(message, meta) {
    if (currentLevel >= LEVELS.info) console.info(format('info', message, meta));
  },
  debug(message, meta) {
    if (currentLevel >= LEVELS.debug) console.debug(format('debug', message, meta));
  },
};

module.exports = logger;

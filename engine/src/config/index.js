/**
 * config/index.js
 *
 * Engine configuration — loads from environment variables
 */

'use strict';

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

const config = {
  NODE_ENV: optional('NODE_ENV', 'development'),

  // Snapshots
  SNAPSHOT_OUTPUT_DIR: optional('SNAPSHOT_OUTPUT_DIR', './data/snapshots'),
  SNAPSHOT_VERSION: optional('SNAPSHOT_VERSION', '1.0.0'),
};

module.exports = config;

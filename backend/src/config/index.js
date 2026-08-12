'use strict';

/**
 * config/index.js
 *
 * Central environment variable access. All env vars are read here and
 * re-exported as typed constants. If a required var is missing, the
 * process throws at startup — never silently.
 *
 * Rule: ONLY import from this file, never from process.env directly.
 */

require('dotenv').config();

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
  // Server
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4000'), 10),

  // Supabase — these are loaded lazily so the server starts without them
  // in Phase 0. They will be required when auth middleware is activated.
  SUPABASE_URL: optional('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: optional('SUPABASE_SERVICE_ROLE_KEY'),

  // Stripe — loaded lazily (Phase 2)
  STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: optional('STRIPE_WEBHOOK_SECRET'),
  STRIPE_FOUNDING_PRICE_ID: optional('STRIPE_FOUNDING_PRICE_ID'),

  // CORS - supports comma-separated list for multiple dev ports
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  // Parse frontend URLs as array for CORS
  getFrontendOrigins() {
    return this.FRONTEND_URL.split(',').map(url => url.trim());
  },

  // Derived helpers
  isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  isProduction() {
    return this.NODE_ENV === 'production';
  },
};

module.exports = config;

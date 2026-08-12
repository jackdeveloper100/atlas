'use strict';

/**
 * app.js
 *
 * Express application factory. Creates and configures the app instance.
 * Separated from server.js so tests can import the app without starting
 * the HTTP server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// ── Security headers ────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────
// Allow requests from configured frontend origins.
// Supports multiple origins (comma-separated in FRONTEND_URL env var).
const allowedOrigins = config.getFrontendOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Request logging ──────────────────────────────────────────────────────
// Use 'dev' in development for coloured output, 'combined' in production.
app.use(morgan(config.isDevelopment() ? 'dev' : 'combined'));

// ── Body parsing ─────────────────────────────────────────────────────────
// Note: the Stripe webhook route needs the raw body, so that route will
// use express.raw() before this runs. Keep this after any raw-body routes.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API routes ───────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Root redirect ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: { message: 'ATLAS API is running. See /api/health for status.' },
    error: null,
  });
});

// ── Global error handler (must be last middleware) ───────────────────────
app.use(errorHandler);

module.exports = app;

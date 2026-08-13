'use strict';

/**
 * routes/index.js
 *
 * Central route registry. All route modules are mounted here under /api.
 * app.js imports this file once and mounts it at /api.
 */

const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const subscriptionRoutes = require('./subscription.routes');
const archiveRoutes = require('./archive.routes');  // Phase 3
const libraryRoutes = require('./library.routes');  // Phase 4
const adminRoutes = require('./admin.routes');      // Phase 7

const router = express.Router();

// ── Active routes ──────────────────────────────────────────────────────
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/archive', archiveRoutes);  // Phase 3
router.use('/library', libraryRoutes);  // Phase 4
router.use('/admin', adminRoutes);      // Phase 7

// 404 for any unmatched /api/* route
router.use((req, res) => {
  const { sendError } = require('../utils/response');
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

module.exports = router;

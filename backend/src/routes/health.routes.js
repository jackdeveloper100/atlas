'use strict';

/**
 * routes/health.routes.js
 *
 * GET /api/health
 *
 * Public health-check endpoint. Returns server status.
 * Used by load balancers, uptime monitors, and the Phase 0 verification step.
 */

const express = require('express');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

router.get('/', (req, res) => {
  sendSuccess(res, { 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

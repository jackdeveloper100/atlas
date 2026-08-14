'use strict';

/**
 * routes/archive.routes.js
 *
 * Public Archive API endpoints (Subscribers).
 * Relational model (Migration 006).
 */

const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireSubscription = require('../middleware/requireSubscription');
const { sendSuccess, sendError } = require('../utils/response');
const archiveService = require('../services/archive.service');

const router = express.Router();

function parseYear(rawYear) {
  if (!/^\d{1,4}$/.test(rawYear)) {
    return { error: 'Year must be an integer between 0 and 9999' };
  }
  const year = parseInt(rawYear, 10);
  if (!Number.isInteger(year) || year < 0 || year > 9999) {
    return { error: 'Year must be an integer between 0 and 9999' };
  }
  return { year };
}

/**
 * GET /api/archive/years
 * List all published archive years.
 */
router.get('/years', authenticate, requireSubscription, async (req, res) => {
  try {
    const { success, years, error } = await archiveService.getPublishedYears();
    if (!success) return sendError(res, `Failed to fetch years: ${error}`, 500);
    return sendSuccess(res, { years, total: years.length });
  } catch (err) {
    console.error('[archive] GET /years error:', err);
    return sendError(res, 'Failed to fetch archive years', 500);
  }
});

/**
 * GET /api/archive/:year
 * Get composed relational payload for a published year.
 */
router.get('/:year', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseYear(req.params.year);
    if (parsed.error) return sendError(res, parsed.error, 400);

    const { success, data, error, notFound } = await archiveService.getYear(parsed.year);

    if (notFound) return sendError(res, `Archive year ${parsed.year} is not available`, 404);
    if (!success) return sendError(res, `Failed to fetch archive year: ${error}`, 500);

    return sendSuccess(res, data);
  } catch (err) {
    console.error('[archive] GET /:year error:', err);
    return sendError(res, 'Failed to fetch archive year', 500);
  }
});

module.exports = router;

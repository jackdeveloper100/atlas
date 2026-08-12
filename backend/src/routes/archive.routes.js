'use strict';

/**
 * routes/archive.routes.js
 *
 * Archive API endpoints.
 *
 * All endpoints require:
 *   - authenticate  (valid Supabase JWT)
 *   - requireSubscription (active subscription in DB)
 *
 * Endpoints:
 *   GET /api/archive/years                    — list published years
 *   GET /api/archive/years/:year              — year metadata
 *   GET /api/archive/snapshot/:year           — full snapshot JSON
 *   GET /api/archive/years/:year/nations      — nations index
 *   GET /api/archive/years/:year/events       — events (filterable)
 *
 * Year validation: strict integer 0–9999, path traversal protection.
 * Response format: { success, data, error } per DECISIONS.md D-013.
 */

const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireSubscription = require('../middleware/requireSubscription');
const { sendSuccess, sendError } = require('../utils/response');
const archiveService = require('../services/archive.service');

const router = express.Router();

// ── Year parameter validation ─────────────────────────────────────────────────

/**
 * Validate and parse a year parameter from a route.
 * Returns { year: number } or { error: string } if invalid.
 *
 * @param {string} rawYear
 * @returns {{ year: number }|{ error: string }}
 */
function parseYear(rawYear) {
  // Reject anything that doesn't look like a plain integer string
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
 * Validate event query filters.
 * Returns sanitized filter object or validation errors.
 */
function parseEventFilters(query) {
  const filters = {};
  const errors = [];

  if (query.event_type !== undefined) {
    if (typeof query.event_type !== 'string' || query.event_type.trim().length === 0) {
      errors.push('event_type must be a non-empty string');
    } else {
      // Whitelist allowed characters (alphanumeric + underscore)
      if (!/^[A-Z_a-z0-9]{1,64}$/.test(query.event_type)) {
        errors.push('event_type contains invalid characters');
      } else {
        filters.event_type = query.event_type;
      }
    }
  }

  if (query.nation_id !== undefined) {
    if (typeof query.nation_id !== 'string' || query.nation_id.trim().length === 0) {
      errors.push('nation_id must be a non-empty string');
    } else {
      // nation_id is alphanumeric + hyphen (matches engine IDs like "ashen-run")
      if (!/^[a-z0-9-]{1,64}$/.test(query.nation_id)) {
        errors.push('nation_id contains invalid characters');
      } else {
        filters.nation_id = query.nation_id;
      }
    }
  }

  if (query.page !== undefined) {
    const page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) {
      errors.push('page must be a positive integer');
    } else {
      filters.page = page;
    }
  }

  if (query.per_page !== undefined) {
    const perPage = parseInt(query.per_page, 10);
    if (isNaN(perPage) || perPage < 1 || perPage > 100) {
      errors.push('per_page must be an integer between 1 and 100');
    } else {
      filters.per_page = perPage;
    }
  }

  return { filters, errors };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/archive/years
 *
 * Returns list of all published archive years with metadata.
 * Requires: auth + active subscription.
 */
router.get('/years', authenticate, requireSubscription, async (req, res) => {
  try {
    const { success, years, error } = await archiveService.getPublishedYears();

    if (!success) {
      return sendError(res, `Failed to fetch years: ${error}`, 500);
    }

    return sendSuccess(res, {
      years,
      total: years.length,
    });
  } catch (err) {
    console.error('[archive] GET /years error:', err);
    return sendError(res, 'Failed to fetch archive years', 500);
  }
});

/**
 * GET /api/archive/years/:year
 *
 * Returns metadata for a single published year.
 * Requires: auth + active subscription.
 */
router.get('/years/:year', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseYear(req.params.year);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { success, year: yearData, error, notFound } = await archiveService.getYearMetadata(parsed.year);

    if (notFound) {
      return sendError(res, `Year ${parsed.year} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to fetch year metadata: ${error}`, 500);
    }

    return sendSuccess(res, yearData);
  } catch (err) {
    console.error('[archive] GET /years/:year error:', err);
    return sendError(res, 'Failed to fetch year metadata', 500);
  }
});

/**
 * GET /api/archive/snapshot/:year
 *
 * Returns the complete snapshot JSON for a published year.
 * Requires: auth + active subscription.
 *
 * Snapshots are immutable — aggressive cache headers applied.
 */
router.get('/snapshot/:year', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseYear(req.params.year);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { success, snapshot, error, notFound } = await archiveService.getSnapshot(parsed.year);

    if (notFound) {
      return sendError(res, `Snapshot for year ${parsed.year} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to fetch snapshot: ${error}`, 500);
    }

    // Snapshots are immutable — aggressive caching (Decision D-015)
    res.set('Cache-Control', 'private, max-age=31536000, immutable');

    return sendSuccess(res, snapshot);
  } catch (err) {
    console.error('[archive] GET /snapshot/:year error:', err);
    return sendError(res, 'Failed to fetch snapshot', 500);
  }
});

/**
 * GET /api/archive/years/:year/nations
 *
 * Returns nation metadata index for a specific year.
 * Requires: auth + active subscription.
 */
router.get('/years/:year/nations', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseYear(req.params.year);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { success, nations, error, notFound } = await archiveService.getNationsForYear(parsed.year);

    if (notFound) {
      return sendError(res, `Year ${parsed.year} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to fetch nations: ${error}`, 500);
    }

    return sendSuccess(res, {
      year: parsed.year,
      nations,
      total: nations.length,
    });
  } catch (err) {
    console.error('[archive] GET /years/:year/nations error:', err);
    return sendError(res, 'Failed to fetch nations', 500);
  }
});

/**
 * GET /api/archive/years/:year/events
 *
 * Returns historical events for a specific year, with optional filters.
 * Requires: auth + active subscription.
 *
 * Query params:
 *   event_type  — filter by event type (e.g. "LEADER_SUCCESSION")
 *   nation_id   — filter by nation ID
 *   page        — page number (default 1)
 *   per_page    — items per page (default 20, max 100)
 */
router.get('/years/:year/events', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseYear(req.params.year);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { filters, errors: filterErrors } = parseEventFilters(req.query);
    if (filterErrors.length > 0) {
      return sendError(res, `Invalid filter parameters: ${filterErrors.join(', ')}`, 400);
    }

    const { success, events, total, error, notFound } = await archiveService.getEventsForYear(
      parsed.year,
      filters
    );

    if (notFound) {
      return sendError(res, `Year ${parsed.year} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to fetch events: ${error}`, 500);
    }

    return sendSuccess(res, {
      year: parsed.year,
      events,
      total,
      page: filters.page || 1,
      per_page: filters.per_page || 20,
    });
  } catch (err) {
    console.error('[archive] GET /years/:year/events error:', err);
    return sendError(res, 'Failed to fetch events', 500);
  }
});

module.exports = router;

'use strict';

/**
 * routes/library.routes.js
 *
 * Library API endpoints (Phase 4). Audio only — item_type "video" is
 * accepted by the schema for forward compatibility but streaming is refused.
 *
 * All endpoints require:
 *   - authenticate  (valid Supabase JWT)
 *   - requireSubscription (active subscription in DB)
 *
 * Endpoints:
 *   GET /api/library/items                    — list published items
 *   GET /api/library/items/:id                — item metadata
 *   GET /api/library/items/:id/stream-url      — short-lived signed audio URL
 *   GET /api/library/items/:id/position        — user's saved playback position
 *   PUT /api/library/items/:id/position        — save user's playback position
 *
 * Response format: { success, data, error } per DECISIONS.md D-013.
 */

const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireSubscription = require('../middleware/requireSubscription');
const { sendSuccess, sendError } = require('../utils/response');
const libraryService = require('../services/library.service');
const { parseItemId, parsePositionSeconds, parseItemTypeFilter } = require('../validators/library.validators');

const router = express.Router();

function parsePagination(query) {
  const filters = {};
  const errors = [];

  if (query.page !== undefined) {
    const page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) errors.push('page must be a positive integer');
    else filters.page = page;
  }

  if (query.per_page !== undefined) {
    const perPage = parseInt(query.per_page, 10);
    if (isNaN(perPage) || perPage < 1 || perPage > 100) errors.push('per_page must be an integer between 1 and 100');
    else filters.per_page = perPage;
  }

  return { filters, errors };
}

/**
 * GET /api/library/items
 */
router.get('/items', authenticate, requireSubscription, async (req, res) => {
  try {
    const typeFilter = parseItemTypeFilter(req.query.type);
    if (typeFilter.error) {
      return sendError(res, typeFilter.error, 400);
    }

    const { filters, errors } = parsePagination(req.query);
    if (errors.length > 0) {
      return sendError(res, `Invalid pagination parameters: ${errors.join(', ')}`, 400);
    }

    const { success, items, total, error } = await libraryService.listItems({ ...typeFilter, ...filters });

    if (!success) {
      return sendError(res, `Failed to fetch library items: ${error}`, 500);
    }

    return sendSuccess(res, {
      items,
      total,
      page: filters.page || 1,
      per_page: filters.per_page || 20,
    });
  } catch (err) {
    console.error('[library] GET /items error:', err);
    return sendError(res, 'Failed to fetch library items', 500);
  }
});

/**
 * GET /api/library/items/:id
 */
router.get('/items/:id', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseItemId(req.params.id);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { success, item, error, notFound } = await libraryService.getItem(parsed.id);

    if (notFound) {
      return sendError(res, `Library item ${parsed.id} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to fetch library item: ${error}`, 500);
    }

    return sendSuccess(res, item);
  } catch (err) {
    console.error('[library] GET /items/:id error:', err);
    return sendError(res, 'Failed to fetch library item', 500);
  }
});

/**
 * GET /api/library/items/:id/stream-url
 */
router.get('/items/:id/stream-url', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseItemId(req.params.id);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { success, url, expiresAt, error, notFound, notAudio } = await libraryService.generateStreamUrl(parsed.id);

    if (notFound) {
      return sendError(res, `Library item ${parsed.id} is not available`, 404);
    }
    if (notAudio) {
      return sendError(res, 'Streaming is only supported for audio items', 400);
    }
    if (!success) {
      return sendError(res, `Failed to generate stream URL: ${error}`, 500);
    }

    return sendSuccess(res, { url, expires_at: expiresAt });
  } catch (err) {
    console.error('[library] GET /items/:id/stream-url error:', err);
    return sendError(res, 'Failed to generate stream URL', 500);
  }
});

/**
 * GET /api/library/items/:id/position
 */
router.get('/items/:id/position', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseItemId(req.params.id);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const { success, positionSeconds, error, notFound } = await libraryService.getPlaybackPosition(
      req.user.id,
      parsed.id
    );

    if (notFound) {
      return sendError(res, `Library item ${parsed.id} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to fetch playback position: ${error}`, 500);
    }

    return sendSuccess(res, { position_seconds: positionSeconds });
  } catch (err) {
    console.error('[library] GET /items/:id/position error:', err);
    return sendError(res, 'Failed to fetch playback position', 500);
  }
});

/**
 * PUT /api/library/items/:id/position
 */
router.put('/items/:id/position', authenticate, requireSubscription, async (req, res) => {
  try {
    const parsed = parseItemId(req.params.id);
    if (parsed.error) {
      return sendError(res, parsed.error, 400);
    }

    const parsedPosition = parsePositionSeconds(req.body ? req.body.position_seconds : undefined);
    if (parsedPosition.error) {
      return sendError(res, parsedPosition.error, 400);
    }

    const { success, positionSeconds, error, notFound } = await libraryService.savePlaybackPosition(
      req.user.id,
      parsed.id,
      parsedPosition.positionSeconds
    );

    if (notFound) {
      return sendError(res, `Library item ${parsed.id} is not available`, 404);
    }
    if (!success) {
      return sendError(res, `Failed to save playback position: ${error}`, 500);
    }

    return sendSuccess(res, { position_seconds: positionSeconds });
  } catch (err) {
    console.error('[library] PUT /items/:id/position error:', err);
    return sendError(res, 'Failed to save playback position', 500);
  }
});

module.exports = router;

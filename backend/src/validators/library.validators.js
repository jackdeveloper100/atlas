'use strict';

/**
 * validators/library.validators.js
 *
 * Plain helper validators for the Library routes, following the same
 * inline-validation pattern used in archive.routes.js (not express-validator
 * chains — express-validator is wired via middleware/validate.js elsewhere
 * in this codebase but the working routes validate inline).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate a library item id path param.
 * @param {string} rawId
 * @returns {{ id: string }|{ error: string }}
 */
function parseItemId(rawId) {
  if (typeof rawId !== 'string' || !UUID_RE.test(rawId)) {
    return { error: 'Library item id must be a valid UUID' };
  }
  return { id: rawId };
}

/**
 * Validate a position_seconds request body value.
 * @param {*} rawPosition
 * @returns {{ positionSeconds: number }|{ error: string }}
 */
function parsePositionSeconds(rawPosition) {
  if (rawPosition === undefined || rawPosition === null) {
    return { error: 'position_seconds is required' };
  }
  const n = Number(rawPosition);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { error: 'position_seconds must be an integer' };
  }
  if (n < 0) {
    return { error: 'position_seconds must not be negative' };
  }
  return { positionSeconds: n };
}

/**
 * Validate item_type query filter, if provided.
 * @param {*} rawType
 * @returns {{ item_type: string }|{ error: string }|{}}
 */
function parseItemTypeFilter(rawType) {
  if (rawType === undefined) return {};
  if (rawType !== 'audio' && rawType !== 'video') {
    return { error: 'type must be "audio" or "video"' };
  }
  return { item_type: rawType };
}

module.exports = {
  parseItemId,
  parsePositionSeconds,
  parseItemTypeFilter,
};

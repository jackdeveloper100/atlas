'use strict';

/**
 * utils/response.js
 *
 * Helpers for consistent API response envelopes.
 *
 * Every response follows the contract defined in DECISIONS.md (D-013):
 *   { success: boolean, data: any | null, error: string | null }
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data     - The payload to return (object, array, or primitive)
 * @param {number} statusCode - HTTP status code (default 200)
 */
function sendSuccess(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message  - Human-readable error description
 * @param {number} statusCode - HTTP status code (default 500)
 */
function sendError(res, message = 'An unexpected error occurred.', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
}

module.exports = { sendSuccess, sendError };

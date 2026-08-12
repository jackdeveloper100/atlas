'use strict';

/**
 * middleware/errorHandler.js
 *
 * Global Express error handler. Must be the last middleware registered
 * in app.js (after all routes). Catches any error passed via next(err).
 *
 * Rule: Never leak stack traces or internal error details to the client.
 */

const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next   - Required 4th param for Express to recognise error handlers
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log full detail server-side
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  // Determine HTTP status (use err.status if set, else 500)
  const statusCode = err.status || err.statusCode || 500;

  // Never expose internal messages in production
  const clientMessage =
    statusCode < 500
      ? err.message || 'Bad request.'
      : 'An unexpected error occurred. Please try again later.';

  return sendError(res, clientMessage, statusCode);
}

module.exports = errorHandler;

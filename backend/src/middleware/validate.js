'use strict';

/**
 * middleware/validate.js
 *
 * Wrapper around express-validator's validationResult.
 * Import this after your validator chains and it will send a 400
 * with all validation errors if any fail.
 *
 * Usage in a route:
 *   router.post('/route', [...validatorChains], validate, controller.action)
 */

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('; ');
    return sendError(res, messages, 400);
  }
  next();
}

module.exports = validate;

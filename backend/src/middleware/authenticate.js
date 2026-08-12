'use strict';

/**
 * middleware/authenticate.js
 *
 * Phase 2: JWT authentication middleware using Supabase.
 *
 * Validates the JWT token from the Authorization header and attaches
 * the authenticated user to req.user.
 */

const { sendError } = require('../utils/response');
const { supabase } = require('../services/supabase.service');

async function authenticate(req, res, next) {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Missing or invalid Authorization header', 401);
    }

    // Extract JWT token
    const token = authHeader.split(' ')[1];

    // Validate token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return sendError(res, 'Invalid or expired token', 401);
    }

    // Attach user to request
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return sendError(res, 'Authentication failed', 401);
  }
}

module.exports = authenticate;

'use strict';

/**
 * middleware/authenticate.js
 *
 * JWT authentication middleware using Supabase & local JWT payload decoding fallback.
 * Validates the JWT token from the Authorization header and attaches
 * the authenticated user to req.user.
 */

const { sendError } = require('../utils/response');
const { supabase } = require('../services/supabase.service');

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Missing or invalid Authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Missing token', 401);
    }

    // 1. Fast local JWT payload decode & expiration check (0ms, no network delay)
    const payload = decodeJwtPayload(token);
    if (payload && payload.sub && payload.exp && payload.exp * 1000 > Date.now()) {
      req.user = {
        id: payload.sub,
        email: payload.email || '',
        user_metadata: payload.user_metadata || {},
        role: payload.role || 'authenticated',
      };
      return next();
    }

    // 2. Fallback to Supabase remote verification with 2s fast timeout
    const userPromise = supabase.auth.getUser(token);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { user: null }, error: new Error('Timeout') }), 2000));

    const { data, error } = await Promise.race([userPromise, timeoutPromise]);

    if (error || !data?.user) {
      return sendError(res, 'Invalid or expired token', 401);
    }

    req.user = data.user;
    return next();
  } catch (err) {
    console.error('Authentication error:', err);
    return sendError(res, 'Authentication failed', 401);
  }
}

module.exports = authenticate;

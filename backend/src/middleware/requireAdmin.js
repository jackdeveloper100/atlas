'use strict';

/**
 * middleware/requireAdmin.js
 *
 * Phase 7: Server-side Admin Authorization Middleware.
 *
 * Validates that the authenticated user possesses an 'admin' role in the database.
 * MUST run after `authenticate` middleware.
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * 1. Queries database server-side via service-role Supabase client.
 * 2. Never trusts frontend claims, request bodies, or local state.
 * 3. Returns 401 Unauthorized if unauthenticated.
 * 4. Returns 403 Forbidden if user is authenticated but lacks admin role.
 */

const { sendError } = require('../utils/response');
const { supabase } = require('../services/supabase.service');

async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Query server-side profiles table using service-role client
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !profile) {
      return sendError(res, 'Admin authorization required', 403, {
        code: 'FORBIDDEN_ADMIN_REQUIRED',
      });
    }

    if (profile.role !== 'admin') {
      return sendError(res, 'Admin authorization required', 403, {
        code: 'FORBIDDEN_ADMIN_REQUIRED',
      });
    }

    // Attach verified admin profile to request
    req.userProfile = profile;
    next();
  } catch (err) {
    console.error('RequireAdmin error:', err);
    return sendError(res, 'Failed to verify admin authorization', 500);
  }
}

module.exports = requireAdmin;

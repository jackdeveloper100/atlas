'use strict';

/**
 * middleware/requireSubscription.js
 *
 * Phase 2: Subscription gate middleware.
 *
 * Checks that the authenticated user has an active subscription.
 * MUST run after authenticate middleware.
 *
 * CRITICAL: Always queries database server-side. Never trusts frontend state.
 */

const { sendError } = require('../utils/response');
const { supabase } = require('../services/supabase.service');

async function requireSubscription(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Query database for latest user subscription (server-side validation)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_end, cancel_at_period_end')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return sendError(res, 'Active subscription required', 403, {
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    const now = new Date();
    const isPeriodValid = data.current_period_end ? new Date(data.current_period_end) > now : false;
    const isSubscribed = data.status === 'active' || data.status === 'trialing' || isPeriodValid;

    if (!isSubscribed) {
      return sendError(res, 'Active subscription required', 403, {
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    // Attach subscription to request for route handlers
    req.subscription = data;
    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    return sendError(res, 'Failed to verify subscription', 500);
  }
}

module.exports = requireSubscription;

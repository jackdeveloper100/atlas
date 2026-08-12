/**
 * Audit Log Service
 * 
 * Server-side only audit logging for compliance and debugging.
 * Users have ZERO access to this table (no RLS policies).
 */

const { supabase } = require('./supabase.service');

/**
 * Log an audit event
 * @param {string} userId - User ID (UUID) or null
 * @param {string} eventType - 'signup' | 'login' | 'subscribe' | 'cancel' | 'delete_account'
 * @param {object} metadata - Additional event metadata (optional)
 */
async function logAuditEvent(userId, eventType, metadata = {}) {
  try {
    const { error } = await supabase.from('audit_log').insert({
      user_id: userId,
      event_type: eventType,
      metadata,
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failure shouldn't break user flow
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

module.exports = { logAuditEvent };

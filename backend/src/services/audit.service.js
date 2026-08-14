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
 * @param {string} eventType - 'signup' | 'login' | 'subscribe' | 'cancel' | 'delete_account' | archive events
 * @param {object} metadata - Additional event metadata (optional)
 */
async function logAuditEvent(userId, eventType, metadata = {}) {
  try {
    let validUserId = null;
    if (userId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (prof) validUserId = prof.id;
    }

    const { error } = await supabase.from('audit_log').insert({
      user_id: validUserId,
      event_type: eventType,
      metadata,
    });

    if (error) {
      console.error('Failed to log audit event:', error.message);
    }
  } catch (err) {
    console.error('Audit logging error:', err.message);
  }
}

module.exports = { logAuditEvent };

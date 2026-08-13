'use strict';

/**
 * services/admin.service.js
 *
 * Phase 7: Service layer for Admin operations.
 *
 * Interacts with database via service-role Supabase client.
 * Enforces business rules and logs administrative audit events.
 */

const { supabase } = require('./supabase.service');
const { logAuditEvent } = require('./audit.service');

class AdminService {
  /**
   * Get overall system dashboard metrics
   */
  async getDashboardStats() {
    // Total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Active subscriptions count
    const { count: activeSubscribers, error: subError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']);

    if (subError) throw subError;

    // Published archive years count
    const { count: publishedSnapshots, error: snapError } = await supabase
      .from('archive_years')
      .select('year', { count: 'exact', head: true })
      .eq('is_published', true);

    if (snapError) throw snapError;

    // Total library items count
    const { count: totalLibraryItems, error: libError } = await supabase
      .from('library_items')
      .select('id', { count: 'exact', head: true });

    if (libError) throw libError;

    // Recent audit logs (latest 5)
    const { data: recentAuditLogs, error: auditError } = await supabase
      .from('audit_log')
      .select('id, user_id, event_type, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (auditError) throw auditError;

    return {
      total_users: totalUsers || 0,
      active_subscribers: activeSubscribers || 0,
      published_snapshots: publishedSnapshots || 0,
      total_library_items: totalLibraryItems || 0,
      recent_audit_logs: recentAuditLogs || [],
    };
  }

  /**
   * Get paginated user accounts list
   */
  async getUsers({ page = 1, limit = 20, search = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('profiles')
      .select('id, display_name, role, age_confirmed_at, created_at, updated_at', { count: 'exact' });

    if (search && search.trim() !== '') {
      query = query.ilike('display_name', `%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: profiles, count, error } = await query;
    if (error) throw error;

    // Fetch subscription details for retrieved profiles
    const userIds = (profiles || []).map((p) => p.id);
    let subscriptionsByUser = {};

    if (userIds.length > 0) {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('id, user_id, status, current_period_end, cancel_at_period_end, subscription_plans(name)')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (subs) {
        subs.forEach((sub) => {
          if (!subscriptionsByUser[sub.user_id]) {
            subscriptionsByUser[sub.user_id] = sub;
          }
        });
      }
    }

    // Combine profile and subscription info
    const users = (profiles || []).map((profile) => ({
      ...profile,
      subscription: subscriptionsByUser[profile.id] || null,
    }));

    return {
      users,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    };
  }

  /**
   * Get details for a single user by ID
   */
  async getUserById(userId) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, role, age_confirmed_at, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    // Fetch subscription history
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(name, price_gbp)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Fetch audit log entries for user
    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('id, event_type, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      user: profile,
      subscriptions: subscriptions || [],
      audit_logs: auditLogs || [],
    };
  }

  /**
   * Update user role (user -> admin or admin -> user)
   */
  async updateUserRole(adminUserId, targetUserId, newRole) {
    if (!['user', 'admin'].includes(newRole)) {
      throw new Error("Invalid role specified. Role must be 'user' or 'admin'.");
    }

    if (adminUserId === targetUserId && newRole !== 'admin') {
      throw new Error('Administrators cannot revoke their own admin access.');
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select('id, display_name, role, updated_at')
      .single();

    if (error) throw error;

    // Audit log the role modification
    await logAuditEvent(adminUserId, 'admin_role_change', {
      target_user_id: targetUserId,
      new_role: newRole,
    });

    return updatedProfile;
  }

  /**
   * Get paginated subscriptions list
   */
  async getSubscriptions({ page = 1, limit = 20, status = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('subscriptions')
      .select('*, subscription_plans(name, price_gbp), profiles(display_name)', { count: 'exact' });

    if (status && status.trim() !== '') {
      query = query.eq('status', status.trim());
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: subscriptions, count, error } = await query;
    if (error) throw error;

    return {
      subscriptions: subscriptions || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    };
  }

  /**
   * Get all archive snapshot records
   */
  async getSnapshots() {
    const { data: snapshots, error } = await supabase
      .from('archive_years')
      .select('*')
      .order('year', { ascending: true });

    if (error) throw error;
    return snapshots || [];
  }

  /**
   * Toggle snapshot publication status
   */
  async toggleSnapshotPublish(adminUserId, year) {
    const yearNum = parseInt(year, 10);
    const { data: current, error: fetchErr } = await supabase
      .from('archive_years')
      .select('year, is_published')
      .eq('year', yearNum)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!current) return null;

    const newPublishState = !current.is_published;
    const { data: updated, error: updateErr } = await supabase
      .from('archive_years')
      .update({
        is_published: newPublishState,
        published_at: newPublishState ? new Date().toISOString() : null,
      })
      .eq('year', yearNum)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log audit event
    await logAuditEvent(adminUserId, 'admin_snapshot_toggle', {
      year: yearNum,
      is_published: newPublishState,
    });

    return updated;
  }

  /**
   * Get all library items metadata
   */
  async getLibraryItems() {
    const { data: items, error } = await supabase
      .from('library_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return items || [];
  }

  /**
   * Toggle library item publication status
   */
  async toggleLibraryPublish(adminUserId, itemId) {
    const { data: current, error: fetchErr } = await supabase
      .from('library_items')
      .select('id, is_published')
      .eq('id', itemId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!current) return null;

    const newPublishState = !current.is_published;
    const { data: updated, error: updateErr } = await supabase
      .from('library_items')
      .update({
        is_published: newPublishState,
        published_at: newPublishState ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log audit event
    await logAuditEvent(adminUserId, 'admin_library_toggle', {
      item_id: itemId,
      is_published: newPublishState,
    });

    return updated;
  }

  /**
   * Get paginated audit logs
   */
  async getAuditLogs({ page = 1, limit = 30, eventType = '', userId = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('audit_log')
      .select('*, profiles(display_name)', { count: 'exact' });

    if (eventType && eventType.trim() !== '') {
      query = query.eq('event_type', eventType.trim());
    }

    if (userId && userId.trim() !== '') {
      query = query.eq('user_id', userId.trim());
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: auditLogs, count, error } = await query;
    if (error) throw error;

    return {
      audit_logs: auditLogs || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    };
  }
}

module.exports = new AdminService();

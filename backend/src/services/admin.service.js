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
   * Create a new user account (Admin operation)
   */
  async createUser(adminUserId, { email, password, displayName, role = 'user' }) {
    if (!email || !password) {
      throw new Error('Email and password are required to create a user account.');
    }

    if (!['user', 'admin'].includes(role)) {
      throw new Error("Invalid role specified. Role must be 'user' or 'admin'.");
    }

    // 1. Create auth user in Supabase Auth via admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: { display_name: displayName || '' },
    });

    if (authError) throw authError;

    const newUser = authData.user;

    // 2. Insert/Upsert into public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUser.id,
        display_name: displayName || '',
        role: role,
        age_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, display_name, role, age_confirmed_at, created_at')
      .single();

    if (profileError) {
      // Cleanup auth user if profile insertion fails
      await supabase.auth.admin.deleteUser(newUser.id).catch(() => {});
      throw profileError;
    }

    // 3. Log audit event
    await logAuditEvent(adminUserId, 'admin_user_create', {
      created_user_id: newUser.id,
      email: email.trim(),
      role: role,
    });

    return profile;
  }

  /**
   * Update full user details (Admin operation)
   */
  async updateUser(adminUserId, targetUserId, { displayName, role, password }) {
    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        throw new Error("Invalid role specified. Role must be 'user' or 'admin'.");
      }
      if (adminUserId === targetUserId && role !== 'admin') {
        throw new Error('Administrators cannot revoke their own admin access.');
      }
      updates.role = role;
    }
    updates.updated_at = new Date().toISOString();

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', targetUserId)
      .select('id, display_name, role, updated_at')
      .single();

    if (profileError) throw profileError;

    // Optional password update by admin
    if (password && password.trim() !== '') {
      const { error: passError } = await supabase.auth.admin.updateUserById(targetUserId, {
        password: password,
      });
      if (passError) throw passError;
    }

    // Audit log
    await logAuditEvent(adminUserId, 'admin_user_update', {
      target_user_id: targetUserId,
      updated_fields: Object.keys(updates),
    });

    return updatedProfile;
  }

  /**
   * Delete a user account (Admin operation)
   */
  async deleteUser(adminUserId, targetUserId) {
    if (adminUserId === targetUserId) {
      throw new Error('Administrators cannot delete their own account from the admin system.');
    }

    // 1. Delete user subscriptions from database
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', targetUserId);

    // 2. Delete profile from database
    await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    // 3. Delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (authError) {
      console.error('Supabase Auth user delete warning:', authError);
    }

    // 4. Log audit event
    await logAuditEvent(adminUserId, 'admin_user_delete', {
      deleted_user_id: targetUserId,
    });

    return { success: true, deleted_user_id: targetUserId };
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
   * Fetch snapshot regions and nations for admin editing (works for both draft and published years)
   */
  async getSnapshotDataForAdmin(year) {
    const yearNum = parseInt(year, 10);
    const storageService = require('./storage.service');

    const defaultRegions = [
      { id: 'region_01', name: 'Amber Vale', nationId: 'ashen-run', population: 75000, area: 1200 },
      { id: 'region_02', name: 'Ashen Reach', nationId: 'ashen-run', population: 82000, area: 1500 },
      { id: 'region_03', name: 'Verdant Basin', nationId: 'verdant-circle', population: 64000, area: 980 },
      { id: 'region_04', name: 'Highland Ridge', nationId: 'iron-confederacy', population: 49000, area: 1100 },
      { id: 'region_05', name: 'Eastern Sound', nationId: 'ashen-run', population: 33000, area: 650 },
    ];

    const defaultNations = [
      { id: 'ashen-run', name: 'Ashen Run', foundedYear: 1850 },
      { id: 'verdant-circle', name: 'Verdant Circle', foundedYear: 1872 },
      { id: 'iron-confederacy', name: 'Iron Confederacy', foundedYear: 1888 },
      { id: 'maritime-league', name: 'Maritime League', foundedYear: 1902 },
    ];

    try {
      const { success, data } = await storageService.getSnapshot(yearNum);
      if (success && data) {
        return {
          year: yearNum,
          regions: data.regions?.length ? data.regions : defaultRegions,
          nations: data.nations?.length ? data.nations : defaultNations,
        };
      }
    } catch (e) {
      // Fallback
    }

    return {
      year: yearNum,
      regions: defaultRegions,
      nations: defaultNations,
    };
  }

  /**
   * Ingest all default engine snapshot files into database
   */
  async ingestDefaultSnapshots(adminUserId) {
    const path = require('path');
    const { ingestDirectory } = require('./ingestion.service');
    const engineSnapshotsDir = path.resolve(__dirname, '../../../engine/data/snapshots');

    const result = await ingestDirectory(engineSnapshotsDir, { verbose: false });

    await logAuditEvent(adminUserId, 'admin_snapshot_toggle', {
      action: 'ingest_all_default_snapshots',
      published_count: result.published,
    });

    return result;
  }

  /**
   * Create a custom year archive snapshot
   */
  async createArchiveSnapshot(adminUserId, { year, isPublished = false }) {
    const yearNum = parseInt(year, 10);

    const defaultRegions = [
      { id: 'region_01', name: 'Amber Vale', nationId: 'ashen-run', population: 75000, area: 1200 },
      { id: 'region_02', name: 'Ashen Reach', nationId: 'ashen-run', population: 82000, area: 1500 },
      { id: 'region_03', name: 'Verdant Basin', nationId: 'verdant-circle', population: 64000, area: 980 },
      { id: 'region_04', name: 'Highland Ridge', nationId: 'iron-confederacy', population: 49000, area: 1100 },
      { id: 'region_05', name: 'Eastern Sound', nationId: 'ashen-run', population: 33000, area: 650 },
    ];

    const defaultNations = [
      { id: 'ashen-run', name: 'Ashen Run', foundedYear: 1850 },
      { id: 'verdant-circle', name: 'Verdant Circle', foundedYear: 1872 },
      { id: 'iron-confederacy', name: 'Iron Confederacy', foundedYear: 1888 },
      { id: 'maritime-league', name: 'Maritime League', foundedYear: 1902 },
    ];

    // Check if snapshot year already exists
    const { data: existing } = await supabase
      .from('archive_years')
      .select('year')
      .eq('year', yearNum)
      .maybeSingle();

    if (existing) {
      throw new Error(`Snapshot record for Year ${yearNum} already exists.`);
    }

    const storageKey = `snapshots/year-${String(yearNum).padStart(4, '0')}.json`;
    const snapshotContent = {
      schemaVersion: '1.0',
      world: {
        year: yearNum,
        population: 303000,
        nationsCount: 4,
        regionsCount: 5,
      },
      nations: defaultNations,
      regions: defaultRegions,
      leaders: [],
      politicalStates: [],
      events: [],
    };

    const storageService = require('./storage.service');
    await storageService.uploadSnapshot(yearNum, snapshotContent);

    const { data: record, error } = await supabase
      .from('archive_years')
      .insert({
        year: yearNum,
        snapshot_key: storageKey,
        schema_version: '1.0',
        sha256_checksum: 'manual-admin-create',
        size_bytes: JSON.stringify(snapshotContent).length,
        is_published: Boolean(isPublished),
        published_at: isPublished ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(adminUserId, 'admin_snapshot_toggle', {
      action: 'create_archive_snapshot',
      year: yearNum,
    });

    return record;
  }

  /**
   * Get dynamic region details overlay for a year and region_id
   */
  async getArchiveRegionDetails(year, regionId) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_region_details')
      .select('*')
      .eq('year', yearNum)
      .eq('region_id', regionId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  /**
   * Upsert dynamic region details overlay for a year and region_id
   */
  async upsertArchiveRegionDetails(adminUserId, year, regionId, payload) {
    const yearNum = parseInt(year, 10);

    const record = {
      year: yearNum,
      region_id: regionId,
      nation_id: payload.nation_id || null,
      region_name: payload.region_name || '',
      governance_badges: payload.governance_badges || [],
      risk_tags: payload.risk_tags || [],
      gdp_value: payload.gdp_value !== undefined ? payload.gdp_value : null,
      gdp_change_pct: payload.gdp_change_pct !== undefined ? payload.gdp_change_pct : null,
      gdp_sparkline: payload.gdp_sparkline || [],
      military_capability: payload.military_capability !== undefined ? payload.military_capability : null,
      personnel_count: payload.personnel_count !== undefined ? payload.personnel_count : null,
      military_sparkline: payload.military_sparkline || [],
      reserves_value: payload.reserves_value !== undefined ? payload.reserves_value : null,
      reserves_note: payload.reserves_note || '',
      reserves_sparkline: payload.reserves_sparkline || [],
      stability_value: payload.stability_value !== undefined ? payload.stability_value : null,
      stability_trend: payload.stability_trend || '',
      stability_sparkline: payload.stability_sparkline || [],
      culture_breakdown: payload.culture_breakdown || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('archive_region_details')
      .upsert(record, { onConflict: 'year,region_id' })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent(adminUserId, 'admin_archive_region_update', {
      year: yearNum,
      region_id: regionId,
    });

    return data;
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

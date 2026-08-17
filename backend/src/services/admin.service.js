'use strict';

/**
 * services/admin.service.js
 *
 * Service layer for Admin operations, including normalized Archive CRUD operations.
 */

const { supabase } = require('./supabase.service');
const { logAuditEvent } = require('./audit.service');

class AdminService {
  /**
   * Get overall system dashboard metrics
   */
  async getDashboardStats() {
    const [
      { count: totalUsers, error: usersError },
      { count: activeSubscribers, error: subError },
      { count: publishedSnapshots, error: snapError },
      { count: totalLibraryItems, error: libError },
      { data: recentAuditLogs, error: auditError },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'trialing']),
      supabase
        .from('archive_years')
        .select('year', { count: 'exact', head: true })
        .or('is_published.eq.true,status.eq.published'),
      supabase.from('library_items').select('id', { count: 'exact', head: true }),
      supabase
        .from('audit_log')
        .select('id, user_id, event_type, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (usersError) throw usersError;
    if (subError) throw subError;
    if (snapError) throw snapError;
    if (libError) throw libError;
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

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(name, price_gbp)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('id, event_type, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      ...profile,
      subscriptions: subscriptions || [],
      audit_logs: auditLogs || [],
    };
  }

  /**
   * Create a new user account
   */
  async createUser(adminUserId, { displayName, role = 'subscriber' }) {
    const fakeId = require('crypto').randomUUID();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: fakeId,
        display_name: displayName,
        role,
        age_confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_user_create', { target_user_id: data.id, role });
    return data;
  }

  /**
   * Update user details or role
   */
  async updateUser(adminUserId, userId, { displayName, role }) {
    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (role !== undefined) updates.role = role;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_user_update', { target_user_id: userId, updates });
    return data;
  }

  /**
   * Delete a user profile
   */
  async deleteUser(adminUserId, userId) {
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_user_delete', { target_user_id: userId });
    return data;
  }

  // ── ARCHIVE YEARS MANAGEMENT ─────────────────────────────────────────────

  async listArchiveYears() {
    const { data, error } = await supabase
      .from('archive_years')
      .select('*')
      .order('year', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getArchiveYear(year) {
    const yearNum = parseInt(year, 10);
    const archiveService = require('./archive.service');
    return await archiveService.getYear(yearNum, true);
  }

  async _resolveValidAdminId(adminUserId) {
    if (!adminUserId) return null;
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', adminUserId)
      .maybeSingle();
    return prof ? prof.id : null;
  }

  async createArchiveYear(adminUserId, { year, title, subtitle, description, isPublished = false }) {
    const yearNum = parseInt(year, 10);

    const { data: existing } = await supabase
      .from('archive_years')
      .select('year')
      .eq('year', yearNum)
      .maybeSingle();

    if (existing) {
      throw new Error(`Archive Year ${yearNum} already exists.`);
    }

    const validCreatedBy = await this._resolveValidAdminId(adminUserId);

    const { data: record, error } = await supabase
      .from('archive_years')
      .insert({
        year: yearNum,
        title: title || `Year ${yearNum}`,
        subtitle: subtitle || null,
        description: description || null,
        status: isPublished ? 'published' : 'draft',
        is_published: Boolean(isPublished),
        published_at: isPublished ? new Date().toISOString() : null,
        created_by: validCreatedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Seed default tabs
    const defaultTabs = [
      { tab_key: 'overview', label: 'Overview', icon: 'LayoutDashboard', display_order: 1 },
      { tab_key: 'political', label: 'Political', icon: 'Landmark', display_order: 2 },
      { tab_key: 'economy', label: 'Economy', icon: 'TrendingUp', display_order: 3 },
      { tab_key: 'health', label: 'Health', icon: 'Activity', display_order: 4 },
      { tab_key: 'justice', label: 'Justice', icon: 'Scale', display_order: 5 },
      { tab_key: 'military', label: 'Military', icon: 'Shield', display_order: 6 },
    ];

    for (const tab of defaultTabs) {
      await supabase.from('archive_tabs').insert({
        year: yearNum,
        tab_key: tab.tab_key,
        label: tab.label,
        icon: tab.icon,
        display_order: tab.display_order,
        is_visible: true,
      });
    }

    await logAuditEvent(adminUserId, 'admin_archive_year_create', { year: yearNum });
    return record;
  }

  async updateArchiveYear(adminUserId, year, { title, subtitle, description, status, isPublished }) {
    const yearNum = parseInt(year, 10);
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (description !== undefined) updates.description = description;

    if (status !== undefined) {
      updates.status = status;
      updates.is_published = status === 'published';
      if (status === 'published') updates.published_at = new Date().toISOString();
    } else if (isPublished !== undefined) {
      updates.is_published = Boolean(isPublished);
      updates.status = isPublished ? 'published' : 'draft';
      if (isPublished) updates.published_at = new Date().toISOString();
    }

    const validUpdatedBy = await this._resolveValidAdminId(adminUserId);
    if (validUpdatedBy) updates.updated_by = validUpdatedBy;

    const { data, error } = await supabase
      .from('archive_years')
      .update(updates)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_year_update', { year: yearNum, updates });
    return data;
  }

  async deleteArchiveYear(adminUserId, year) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_years')
      .delete()
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_year_delete', { year: yearNum });
    return data;
  }

  async duplicateArchiveYear(adminUserId, sourceYear, targetYear) {
    const srcYear = parseInt(sourceYear, 10);
    const tgtYear = parseInt(targetYear, 10);

    const { data: srcRecord } = await supabase.from('archive_years').select('*').eq('year', srcYear).maybeSingle();
    if (!srcRecord) throw new Error(`Source Year ${srcYear} not found.`);

    const { data: tgtExisting } = await supabase.from('archive_years').select('year').eq('year', tgtYear).maybeSingle();
    if (tgtExisting) throw new Error(`Target Year ${tgtYear} already exists.`);

    // Create target year record
    await this.createArchiveYear(adminUserId, {
      year: tgtYear,
      title: `${srcRecord.title || `Year ${srcYear}`} (Copy)`,
      subtitle: srcRecord.subtitle,
      description: srcRecord.description,
      isPublished: false,
    });

    // Copy nations
    const { data: srcNations } = await supabase.from('archive_nations').select('*').eq('year', srcYear);
    const nationIdMap = {};
    if (srcNations) {
      for (const n of srcNations) {
        const { data: newN } = await supabase.from('archive_nations').insert({
          year: tgtYear,
          nation_key: n.nation_key,
          name: n.name,
          short_name: n.short_name,
          description: n.description,
          color: n.color,
          flag_url: n.flag_url,
          population: n.population,
          government_type: n.government_type,
          founded_year: n.founded_year,
          centralized_power: n.centralized_power,
          stability: n.stability,
          display_order: n.display_order,
          is_visible: n.is_visible,
        }).select().single();
        if (newN) nationIdMap[n.id] = newN.id;
      }
    }

    // Copy regions
    const { data: srcRegions } = await supabase.from('archive_regions').select('*').eq('year', srcYear);
    const regionIdMap = {};
    if (srcRegions) {
      for (const r of srcRegions) {
        const { data: newR } = await supabase.from('archive_regions').insert({
          year: tgtYear,
          region_key: r.region_key,
          nation_id: r.nation_id ? nationIdMap[r.nation_id] : null,
          name: r.name,
          short_name: r.short_name,
          description: r.description,
          population: r.population,
          area: r.area,
          urbanization: r.urbanization,
          map_path: r.map_path,
          map_label_x: r.map_label_x,
          map_label_y: r.map_label_y,
          map_color: r.map_color,
          is_claimed: r.is_claimed,
          display_order: r.display_order,
          is_visible: r.is_visible,
        }).select().single();
        if (newR) regionIdMap[r.id] = newR.id;
      }
    }

    // Copy leaders
    const { data: srcLeaders } = await supabase.from('archive_leaders').select('*').eq('year', srcYear);
    const leaderIdMap = {};
    if (srcLeaders) {
      for (const l of srcLeaders) {
        const { data: newL } = await supabase.from('archive_leaders').insert({
          year: tgtYear,
          nation_id: l.nation_id ? nationIdMap[l.nation_id] : null,
          name: l.name,
          title: l.title,
          birth_year: l.birth_year,
          death_year: l.death_year,
          age_override: l.age_override,
          legitimacy: l.legitimacy,
          influence: l.influence,
          portrait_url: l.portrait_url,
          biography: l.biography,
          display_order: l.display_order,
          is_visible: l.is_visible,
        }).select().single();
        if (newL) leaderIdMap[l.id] = newL.id;
      }
    }

    // Copy events
    const { data: srcEvents } = await supabase.from('archive_events').select('*').eq('year', srcYear);
    if (srcEvents) {
      for (const e of srcEvents) {
        const { data: newEv } = await supabase.from('archive_events').insert({
          year: tgtYear,
          title: e.title,
          description: e.description,
          event_type: e.event_type,
          badge_label: e.badge_label,
          badge_color: e.badge_color,
          quarter: e.quarter,
          importance: e.importance,
          display_order: e.display_order,
          is_visible: e.is_visible,
        }).select().single();

        if (newEv) {
          const { data: srcEvNations } = await supabase.from('archive_event_nations').select('nation_id').eq('event_id', e.id);
          if (srcEvNations) {
            for (const en of srcEvNations) {
              if (nationIdMap[en.nation_id]) {
                await supabase.from('archive_event_nations').insert({ event_id: newEv.id, nation_id: nationIdMap[en.nation_id] });
              }
            }
          }
        }
      }
    }

    await logAuditEvent(adminUserId, 'admin_archive_year_duplicate', { source_year: srcYear, target_year: tgtYear });
    return await this.getArchiveYear(tgtYear);
  }

  async publishArchiveYear(adminUserId, year) {
    return this.updateArchiveYear(adminUserId, year, { status: 'published' });
  }

  async unpublishArchiveYear(adminUserId, year) {
    return this.updateArchiveYear(adminUserId, year, { status: 'draft' });
  }

  async archiveArchiveYear(adminUserId, year) {
    return this.updateArchiveYear(adminUserId, year, { status: 'archived' });
  }

  // ── NATIONS CRUD ─────────────────────────────────────────────────────────

  async createNation(adminUserId, year, payload) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_nations')
      .insert({
        year: yearNum,
        nation_key: payload.nationKey || payload.nation_key || `nation_${Date.now()}`,
        name: payload.name,
        short_name: payload.shortName || payload.short_name || payload.name,
        description: payload.description || null,
        color: payload.color || '#3b82f6',
        flag_url: payload.flagUrl || payload.flag_url || null,
        population: payload.population || 0,
        government_type: payload.governmentType || payload.government_type || 'Monarchy',
        founded_year: payload.foundedYear || payload.founded_year || 0,
        centralized_power: payload.centralizedPower !== undefined ? payload.centralizedPower : 0.5,
        stability: payload.stability !== undefined ? payload.stability : 0.5,
        display_order: payload.displayOrder || payload.display_order || 0,
        is_visible: payload.isVisible !== undefined ? payload.isVisible : true,
      })
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_nation_create', { year: yearNum, nation_id: data.id });
    return data;
  }

  async updateNation(adminUserId, year, id, payload) {
    const yearNum = parseInt(year, 10);
    const updates = { updated_at: new Date().toISOString() };

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.shortName !== undefined || payload.short_name !== undefined) updates.short_name = payload.shortName || payload.short_name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.color !== undefined) updates.color = payload.color;
    if (payload.flagUrl !== undefined || payload.flag_url !== undefined) updates.flag_url = payload.flagUrl || payload.flag_url;
    if (payload.population !== undefined) updates.population = payload.population;
    if (payload.governmentType !== undefined || payload.government_type !== undefined) updates.government_type = payload.governmentType || payload.government_type;
    if (payload.foundedYear !== undefined || payload.founded_year !== undefined) updates.founded_year = payload.foundedYear || payload.founded_year;
    if (payload.centralizedPower !== undefined) updates.centralized_power = payload.centralizedPower;
    if (payload.stability !== undefined) updates.stability = payload.stability;
    if (payload.capitalRegionId !== undefined || payload.capital_region_id !== undefined) updates.capital_region_id = payload.capitalRegionId || payload.capital_region_id;
    if (payload.headOfStateId !== undefined || payload.head_of_state_id !== undefined) updates.head_of_state_id = payload.headOfStateId || payload.head_of_state_id;
    if (payload.displayOrder !== undefined || payload.display_order !== undefined) updates.display_order = payload.displayOrder || payload.display_order;
    if (payload.isVisible !== undefined || payload.is_visible !== undefined) updates.is_visible = payload.isVisible !== undefined ? payload.isVisible : payload.is_visible;

    const { data, error } = await supabase
      .from('archive_nations')
      .update(updates)
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_nation_update', { year: yearNum, nation_id: id });
    return data;
  }

  async deleteNation(adminUserId, year, id) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_nations')
      .delete()
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_nation_delete', { year: yearNum, nation_id: id });
    return data;
  }

  // ── REGIONS CRUD ─────────────────────────────────────────────────────────

  async createRegion(adminUserId, year, payload) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_regions')
      .insert({
        year: yearNum,
        region_key: payload.regionKey || payload.region_key || `region_${Date.now()}`,
        nation_id: payload.nationId || payload.nation_id || null,
        name: payload.name,
        short_name: payload.shortName || payload.short_name || payload.name,
        description: payload.description || null,
        population: payload.population || 0,
        area: payload.area || 1000,
        urbanization: payload.urbanization !== undefined ? payload.urbanization : 0.5,
        map_path: payload.mapPath || payload.map_path || null,
        map_label_x: payload.mapLabelX || payload.map_label_x || null,
        map_label_y: payload.mapLabelY || payload.map_label_y || null,
        map_color: payload.mapColor || payload.map_color || null,
        is_claimed: payload.isClaimed !== undefined ? payload.isClaimed : true,
        display_order: payload.displayOrder || payload.display_order || 0,
        is_visible: payload.isVisible !== undefined ? payload.isVisible : true,
      })
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_region_create', { year: yearNum, region_id: data.id });
    return data;
  }

  async updateRegion(adminUserId, year, id, payload) {
    const yearNum = parseInt(year, 10);
    const updates = { updated_at: new Date().toISOString() };

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.shortName !== undefined || payload.short_name !== undefined) updates.short_name = payload.shortName || payload.short_name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.nationId !== undefined || payload.nation_id !== undefined) updates.nation_id = payload.nationId || payload.nation_id;
    if (payload.population !== undefined) updates.population = payload.population;
    if (payload.area !== undefined) updates.area = payload.area;
    if (payload.urbanization !== undefined) updates.urbanization = payload.urbanization;
    if (payload.mapPath !== undefined || payload.map_path !== undefined) updates.map_path = payload.mapPath || payload.map_path;
    if (payload.mapLabelX !== undefined || payload.map_label_x !== undefined) updates.map_label_x = payload.mapLabelX || payload.map_label_x;
    if (payload.mapLabelY !== undefined || payload.map_label_y !== undefined) updates.map_label_y = payload.mapLabelY || payload.map_label_y;
    if (payload.mapColor !== undefined || payload.map_color !== undefined) updates.map_color = payload.mapColor || payload.map_color;
    if (payload.isClaimed !== undefined || payload.is_claimed !== undefined) updates.is_claimed = payload.isClaimed !== undefined ? payload.isClaimed : payload.is_claimed;
    if (payload.displayOrder !== undefined || payload.display_order !== undefined) updates.display_order = payload.displayOrder || payload.display_order;
    if (payload.isVisible !== undefined || payload.is_visible !== undefined) updates.is_visible = payload.isVisible !== undefined ? payload.isVisible : payload.is_visible;

    const { data, error } = await supabase
      .from('archive_regions')
      .update(updates)
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_region_update', { year: yearNum, region_id: id });
    return data;
  }

  async deleteRegion(adminUserId, year, id) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_regions')
      .delete()
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_region_delete', { year: yearNum, region_id: id });
    return data;
  }

  // ── LEADERS CRUD ─────────────────────────────────────────────────────────

  async createLeader(adminUserId, year, payload) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_leaders')
      .insert({
        year: yearNum,
        nation_id: payload.nationId || payload.nation_id || null,
        name: payload.name,
        title: payload.title || 'Leader',
        birth_year: payload.birthYear || payload.birth_year || null,
        death_year: payload.deathYear || payload.death_year || null,
        age_override: payload.ageOverride || payload.age_override || null,
        legitimacy: payload.legitimacy !== undefined ? payload.legitimacy : 0.5,
        influence: payload.influence !== undefined ? payload.influence : 0.5,
        portrait_url: payload.portraitUrl || payload.portrait_url || null,
        biography: payload.biography || null,
        display_order: payload.displayOrder || payload.display_order || 0,
        is_visible: payload.isVisible !== undefined ? payload.isVisible : true,
      })
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_leader_create', { year: yearNum, leader_id: data.id });
    return data;
  }

  async updateLeader(adminUserId, year, id, payload) {
    const yearNum = parseInt(year, 10);
    const updates = { updated_at: new Date().toISOString() };

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.nationId !== undefined || payload.nation_id !== undefined) updates.nation_id = payload.nationId || payload.nation_id;
    if (payload.birthYear !== undefined || payload.birth_year !== undefined) updates.birth_year = payload.birthYear || payload.birth_year;
    if (payload.deathYear !== undefined || payload.death_year !== undefined) updates.death_year = payload.deathYear || payload.death_year;
    if (payload.ageOverride !== undefined || payload.age_override !== undefined) updates.age_override = payload.ageOverride || payload.age_override;
    if (payload.legitimacy !== undefined) updates.legitimacy = payload.legitimacy;
    if (payload.influence !== undefined) updates.influence = payload.influence;
    if (payload.portraitUrl !== undefined || payload.portrait_url !== undefined) updates.portrait_url = payload.portraitUrl || payload.portrait_url;
    if (payload.biography !== undefined) updates.biography = payload.biography;
    if (payload.displayOrder !== undefined || payload.display_order !== undefined) updates.display_order = payload.displayOrder || payload.display_order;
    if (payload.isVisible !== undefined || payload.is_visible !== undefined) updates.is_visible = payload.isVisible !== undefined ? payload.isVisible : payload.is_visible;

    const { data, error } = await supabase
      .from('archive_leaders')
      .update(updates)
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_leader_update', { year: yearNum, leader_id: id });
    return data;
  }

  async deleteLeader(adminUserId, year, id) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_leaders')
      .delete()
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_leader_delete', { year: yearNum, leader_id: id });
    return data;
  }

  // ── EVENTS CRUD ──────────────────────────────────────────────────────────

  async createEvent(adminUserId, year, payload) {
    const yearNum = parseInt(year, 10);
    const { data: eventRecord, error } = await supabase
      .from('archive_events')
      .insert({
        year: yearNum,
        title: payload.title,
        description: payload.description || null,
        event_type: payload.eventType || payload.event_type || 'HISTORICAL_EVENT',
        badge_label: payload.badgeLabel || payload.badge_label || null,
        badge_color: payload.badgeColor || payload.badge_color || null,
        quarter: payload.quarter || 1,
        importance: payload.importance !== undefined ? payload.importance : 1.0,
        display_order: payload.displayOrder || payload.display_order || 0,
        is_visible: payload.isVisible !== undefined ? payload.isVisible : true,
      })
      .select()
      .single();

    if (error) throw error;

    const nationIds = payload.nationIds || payload.nation_ids || [];
    for (const nid of nationIds) {
      await supabase.from('archive_event_nations').insert({ event_id: eventRecord.id, nation_id: nid });
    }

    const regionIds = payload.regionIds || payload.region_ids || [];
    for (const rid of regionIds) {
      await supabase.from('archive_event_regions').insert({ event_id: eventRecord.id, region_id: rid });
    }

    await logAuditEvent(adminUserId, 'admin_archive_event_create', { year: yearNum, event_id: eventRecord.id });
    return eventRecord;
  }

  async updateEvent(adminUserId, year, id, payload) {
    const yearNum = parseInt(year, 10);
    const updates = { updated_at: new Date().toISOString() };

    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.eventType !== undefined || payload.event_type !== undefined) updates.event_type = payload.eventType || payload.event_type;
    if (payload.badgeLabel !== undefined || payload.badge_label !== undefined) updates.badge_label = payload.badgeLabel || payload.badge_label;
    if (payload.badgeColor !== undefined || payload.badge_color !== undefined) updates.badge_color = payload.badgeColor || payload.badge_color;
    if (payload.quarter !== undefined) updates.quarter = payload.quarter;
    if (payload.importance !== undefined) updates.importance = payload.importance;
    if (payload.displayOrder !== undefined || payload.display_order !== undefined) updates.display_order = payload.displayOrder || payload.display_order;
    if (payload.isVisible !== undefined || payload.is_visible !== undefined) updates.is_visible = payload.isVisible !== undefined ? payload.isVisible : payload.is_visible;

    const { data, error } = await supabase
      .from('archive_events')
      .update(updates)
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;

    if (payload.nationIds !== undefined || payload.nation_ids !== undefined) {
      await supabase.from('archive_event_nations').delete().eq('event_id', id);
      const nationIds = payload.nationIds || payload.nation_ids || [];
      for (const nid of nationIds) {
        await supabase.from('archive_event_nations').insert({ event_id: id, nation_id: nid });
      }
    }

    if (payload.regionIds !== undefined || payload.region_ids !== undefined) {
      await supabase.from('archive_event_regions').delete().eq('event_id', id);
      const regionIds = payload.regionIds || payload.region_ids || [];
      for (const rid of regionIds) {
        await supabase.from('archive_event_regions').insert({ event_id: id, region_id: rid });
      }
    }

    await logAuditEvent(adminUserId, 'admin_archive_event_update', { year: yearNum, event_id: id });
    return data;
  }

  async deleteEvent(adminUserId, year, id) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_events')
      .delete()
      .eq('id', id)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_event_delete', { year: yearNum, event_id: id });
    return data;
  }

  // ── TABS CRUD ────────────────────────────────────────────────────────────

  async upsertTabs(adminUserId, year, tabsArray) {
    const yearNum = parseInt(year, 10);
    const results = [];

    for (let i = 0; i < tabsArray.length; i++) {
      const t = tabsArray[i];
      const payload = {
        year: yearNum,
        tab_key: t.tabKey || t.tab_key,
        label: t.label,
        icon: t.icon || null,
        description: t.description || null,
        display_order: t.displayOrder || t.display_order || i + 1,
        is_visible: t.isVisible !== undefined ? t.isVisible : (t.is_visible !== undefined ? t.is_visible : true),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('archive_tabs')
        .upsert(payload, { onConflict: 'year,tab_key' })
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    await logAuditEvent(adminUserId, 'admin_archive_tab_update', { year: yearNum, count: results.length });
    return results;
  }

  // ── ENTITY DETAILS (Badges, Tags, Culture) ───────────────────────────────

  async upsertEntityDetails(adminUserId, year, entityType, entityId, payload) {
    const yearNum = parseInt(year, 10);
    const record = {
      year: yearNum,
      governance_badges: payload.governanceBadges || payload.governance_badges || [],
      risk_tags: payload.riskTags || payload.risk_tags || [],
      culture_breakdown: payload.cultureBreakdown || payload.culture_breakdown || [],
      updated_at: new Date().toISOString(),
    };

    if (entityType === 'region') record.region_id = entityId;
    else if (entityType === 'nation') record.nation_id = entityId;
    else if (entityType === 'leader') record.leader_id = entityId;
    else throw new Error(`Invalid entityType: ${entityType}`);

    const { data, error } = await supabase
      .from('archive_entity_details')
      .upsert(record, { onConflict: 'year,entity_ref_id' })
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_entity_details_update', { year: yearNum, entity_type: entityType, entity_id: entityId });
    return data;
  }

  // ── METRICS & METRIC SERIES ──────────────────────────────────────────────

  async createMetric(adminUserId, year, entityType, entityId, payload) {
    const yearNum = parseInt(year, 10);
    const record = {
      year: yearNum,
      tab_id: payload.tabId || payload.tab_id,
      metric_key: payload.metricKey || payload.metric_key || `metric_${Date.now()}`,
      label: payload.label,
      value: payload.value !== undefined ? String(payload.value) : null,
      numeric_value: payload.numericValue !== undefined ? payload.numericValue : (payload.numeric_value !== undefined ? payload.numeric_value : null),
      unit: payload.unit || null,
      prefix: payload.prefix || null,
      suffix: payload.suffix || null,
      description: payload.description || null,
      trend_value: payload.trendValue || payload.trend_value || null,
      trend_type: payload.trendType || payload.trend_type || null,
      display_type: payload.displayType || payload.display_type || 'number',
      icon: payload.icon || null,
      is_visible: payload.isVisible !== undefined ? payload.isVisible : true,
      display_order: payload.displayOrder || payload.display_order || 0,
    };

    if (entityType === 'region') record.region_id = entityId;
    else if (entityType === 'nation') record.nation_id = entityId;
    else if (entityType === 'leader') record.leader_id = entityId;
    else throw new Error(`Invalid entityType: ${entityType}`);

    const { data, error } = await supabase
      .from('archive_metrics')
      .insert(record)
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(payload.series) && payload.series.length > 0) {
      await this.upsertMetricSeries(adminUserId, data.id, payload.series);
    }

    await logAuditEvent(adminUserId, 'admin_archive_metric_create', { year: yearNum, metric_id: data.id });
    return data;
  }

  async updateMetric(adminUserId, year, metricId, payload) {
    const yearNum = parseInt(year, 10);
    const updates = { updated_at: new Date().toISOString() };

    if (payload.label !== undefined) updates.label = payload.label;
    if (payload.value !== undefined) updates.value = String(payload.value);
    if (payload.numericValue !== undefined || payload.numeric_value !== undefined) updates.numeric_value = payload.numericValue !== undefined ? payload.numericValue : payload.numeric_value;
    if (payload.unit !== undefined) updates.unit = payload.unit;
    if (payload.prefix !== undefined) updates.prefix = payload.prefix;
    if (payload.suffix !== undefined) updates.suffix = payload.suffix;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.trendValue !== undefined || payload.trend_value !== undefined) updates.trend_value = payload.trendValue || payload.trend_value;
    if (payload.trendType !== undefined || payload.trend_type !== undefined) updates.trend_type = payload.trendType || payload.trend_type;
    if (payload.displayType !== undefined || payload.display_type !== undefined) updates.display_type = payload.displayType || payload.display_type;
    if (payload.icon !== undefined) updates.icon = payload.icon;
    if (payload.displayOrder !== undefined || payload.display_order !== undefined) updates.display_order = payload.displayOrder || payload.display_order;
    if (payload.isVisible !== undefined || payload.is_visible !== undefined) updates.is_visible = payload.isVisible !== undefined ? payload.isVisible : payload.is_visible;

    const { data, error } = await supabase
      .from('archive_metrics')
      .update(updates)
      .eq('id', metricId)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(payload.series)) {
      await this.upsertMetricSeries(adminUserId, metricId, payload.series);
    }

    await logAuditEvent(adminUserId, 'admin_archive_metric_update', { year: yearNum, metric_id: metricId });
    return data;
  }

  async deleteMetric(adminUserId, year, metricId) {
    const yearNum = parseInt(year, 10);
    const { data, error } = await supabase
      .from('archive_metrics')
      .delete()
      .eq('id', metricId)
      .eq('year', yearNum)
      .select()
      .single();

    if (error) throw error;
    await logAuditEvent(adminUserId, 'admin_archive_metric_delete', { year: yearNum, metric_id: metricId });
    return data;
  }

  async upsertMetricSeries(adminUserId, metricId, seriesArray) {
    await supabase.from('archive_metric_series').delete().eq('metric_id', metricId);

    const inserted = [];
    for (let i = 0; i < seriesArray.length; i++) {
      const pt = seriesArray[i];
      const val = typeof pt === 'number' ? pt : (pt.value !== undefined ? pt.value : 0);
      const label = typeof pt === 'object' && pt.label ? pt.label : `P${i + 1}`;

      const { data, error } = await supabase
        .from('archive_metric_series')
        .insert({
          metric_id: metricId,
          sequence: i + 1,
          value: val,
          label,
        })
        .select()
        .single();

      if (!error && data) inserted.push(data);
    }

    return inserted;
  }

  async reorderEntities(adminUserId, entityType, year, orderedIds) {
    const yearNum = parseInt(year, 10);
    const tableNameMap = {
      nations: 'archive_nations',
      regions: 'archive_regions',
      leaders: 'archive_leaders',
      events: 'archive_events',
      metrics: 'archive_metrics',
    };

    const tableName = tableNameMap[entityType];
    if (!tableName) throw new Error(`Invalid entityType for reorder: ${entityType}`);

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from(tableName)
        .update({ display_order: i + 1 })
        .eq('id', orderedIds[i])
        .eq('year', yearNum);
    }

    return { success: true };
  }

  // ── LIBRARY ITEMS ────────────────────────────────────────────────────────

  async getLibraryItems() {
    const { data: items, error } = await supabase
      .from('library_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return items || [];
  }

  async createLibraryItem(adminUserId, itemData) {
    const validAdminId = await this._resolveValidAdminId(adminUserId);
    const {
      title,
      description = '',
      item_type = 'audio',
      storage_path,
      duration_seconds = 0,
      metadata = {},
      is_published = false,
    } = itemData;

    const randomSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const autoPath =
      storage_path && storage_path.trim()
        ? storage_path.trim()
        : `library/media-${randomSuffix}.${item_type === 'video' ? 'mp4' : 'mp3'}`;

    const { data, error } = await supabase
      .from('library_items')
      .insert({
        title,
        description,
        item_type,
        storage_path: autoPath,
        duration_seconds: duration_seconds ? Number(duration_seconds) : null,
        metadata: {
          category: metadata.category || 'Political',
          subtitle: metadata.subtitle || '',
          cover_image_url: metadata.cover_image_url || '',
          related_item_ids: metadata.related_item_ids || [],
          audio_url: metadata.audio_url || '',
        },
        is_published: !!is_published,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(validAdminId, 'admin_library_toggle', {
      item_id: data.id,
      title: data.title,
    });

    return data;
  }

  async updateLibraryItem(adminUserId, itemId, itemData) {
    const validAdminId = await this._resolveValidAdminId(adminUserId);
    const { data: existing, error: fetchErr } = await supabase
      .from('library_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) return null;

    const updatedMetadata = {
      ...(existing.metadata || {}),
      ...(itemData.metadata || {}),
    };

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (itemData.title !== undefined) updatePayload.title = itemData.title;
    if (itemData.description !== undefined) updatePayload.description = itemData.description;
    if (itemData.item_type !== undefined) updatePayload.item_type = itemData.item_type;
    if (itemData.storage_path !== undefined && itemData.storage_path.trim()) {
      updatePayload.storage_path = itemData.storage_path.trim();
    }
    if (itemData.duration_seconds !== undefined)
      updatePayload.duration_seconds = itemData.duration_seconds ? Number(itemData.duration_seconds) : null;
    if (itemData.metadata !== undefined) updatePayload.metadata = updatedMetadata;
    if (itemData.is_published !== undefined) {
      updatePayload.is_published = !!itemData.is_published;
      if (itemData.is_published && !existing.published_at) {
        updatePayload.published_at = new Date().toISOString();
      } else if (!itemData.is_published) {
        updatePayload.published_at = null;
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('library_items')
      .update(updatePayload)
      .eq('id', itemId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await logAuditEvent(validAdminId, 'admin_library_toggle', {
      item_id: itemId,
      updated_fields: Object.keys(updatePayload),
    });

    return updated;
  }

  async deleteLibraryItem(adminUserId, itemId) {
    const validAdminId = await this._resolveValidAdminId(adminUserId);
    const { data: existing, error: fetchErr } = await supabase
      .from('library_items')
      .select('id, title')
      .eq('id', itemId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) return false;

    const { error: deleteErr } = await supabase
      .from('library_items')
      .delete()
      .eq('id', itemId);

    if (deleteErr) throw deleteErr;

    await logAuditEvent(validAdminId, 'admin_library_toggle', {
      item_id: itemId,
      title: existing.title,
    });

    return true;
  }

  async toggleLibraryPublish(adminUserId, itemId) {
    const validAdminId = await this._resolveValidAdminId(adminUserId);
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

    await logAuditEvent(validAdminId, 'admin_library_toggle', {
      item_id: itemId,
      is_published: newPublishState,
    });

    return updated;
  }

  // ── AUDIT LOGS ───────────────────────────────────────────────────────────

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

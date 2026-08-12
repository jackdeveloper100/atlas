'use strict';

/**
 * archive.repository.js
 *
 * All direct Supabase/PostgreSQL database access for the Archive domain.
 *
 * Tables used:
 *   - archive_years       (migration 002)
 *   - nations_index       (migration 002)
 *   - historical_events   (migration 002)
 *
 * IMPORTANT: All writes use the service-role client (bypasses RLS).
 * Reads are also via service-role — subscription checks happen in Express middleware.
 */

const { supabase } = require('../services/supabase.service');

// ── archive_years ────────────────────────────────────────────────────────────

/**
 * List all published years, ordered ascending.
 *
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
async function listPublishedYears() {
  const { data, error } = await supabase
    .from('archive_years')
    .select('year, snapshot_key, schema_version, snapshot_size_bytes, published_at, created_at')
    .eq('is_published', true)
    .order('year', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find a single archive_years row by year.
 *
 * @param {number} year
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function findYear(year) {
  const { data, error } = await supabase
    .from('archive_years')
    .select('*')
    .eq('year', year)
    .maybeSingle();  // returns null (not error) if not found

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Insert or update an archive_years record.
 * Uses upsert on the PRIMARY KEY (year).
 *
 * @param {object} record - Fields to insert/update
 * @param {number} record.year
 * @param {string} record.snapshot_key
 * @param {string} record.schema_version
 * @param {number} record.snapshot_size_bytes
 * @param {string} record.checksum_sha256
 * @param {boolean} [record.is_published]
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function upsertYear(record) {
  const { data, error } = await supabase
    .from('archive_years')
    .upsert(record, {
      onConflict: 'year',
      ignoreDuplicates: false,  // update on conflict
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Mark a year as published.
 *
 * @param {number} year
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function markYearPublished(year) {
  const { data, error } = await supabase
    .from('archive_years')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('year', year)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ── nations_index ─────────────────────────────────────────────────────────────

/**
 * Upsert nations for a given year.
 * Uses unique constraint on (year, nation_id).
 *
 * @param {number} year
 * @param {object[]} nations - Array of nation objects from snapshot
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
async function upsertNationsForYear(year, nations) {
  if (!nations || nations.length === 0) {
    return { data: [], error: null };
  }

  const records = nations.map(n => ({
    year,
    nation_id: n.id,
    name: n.name,
    population: n.population,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('nations_index')
    .upsert(records, {
      onConflict: 'year,nation_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Get nations index for a specific year.
 *
 * @param {number} year
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
async function findNationsForYear(year) {
  const { data, error } = await supabase
    .from('nations_index')
    .select('nation_id, name, population, is_active')
    .eq('year', year)
    .order('name', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ── historical_events ─────────────────────────────────────────────────────────

/**
 * Upsert events for a given year.
 * Uses unique constraint on (year, event_id).
 *
 * @param {number} year
 * @param {object[]} events - Array of event objects from snapshot
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
async function upsertEventsForYear(year, events) {
  if (!events || events.length === 0) {
    return { data: [], error: null };
  }

  const records = events.map(e => ({
    year,
    event_id: e.id,
    event_type: e.type,
    nation_id: (e.nationIds && e.nationIds.length > 0) ? e.nationIds[0] : null,
    description: e.description,
    quarter: e.quarter,
  }));

  const { data, error } = await supabase
    .from('historical_events')
    .upsert(records, {
      onConflict: 'year,event_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Find historical events with optional filters.
 *
 * @param {object} filters
 * @param {number} [filters.year] - Filter to specific year
 * @param {string} [filters.event_type] - Filter by event type
 * @param {string} [filters.nation_id] - Filter by nation ID
 * @param {number} [filters.page] - Page number (1-indexed)
 * @param {number} [filters.per_page] - Items per page (max 100)
 * @returns {Promise<{ data: object[]|null, total: number, error: string|null }>}
 */
async function findEvents(filters = {}) {
  const {
    year,
    event_type,
    nation_id,
    page = 1,
    per_page = 20,
  } = filters;

  const safePerPage = Math.min(Math.max(1, parseInt(per_page, 10) || 20), 100);
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const from = (safePage - 1) * safePerPage;
  const to = from + safePerPage - 1;

  let query = supabase
    .from('historical_events')
    .select('year, event_id, event_type, nation_id, description, quarter, created_at', { count: 'exact' })
    .order('year', { ascending: true })
    .order('quarter', { ascending: true })
    .range(from, to);

  if (year !== undefined && year !== null) {
    query = query.eq('year', year);
  }
  if (event_type) {
    query = query.eq('event_type', event_type);
  }
  if (nation_id) {
    query = query.eq('nation_id', nation_id);
  }

  const { data, error, count } = await query;

  if (error) return { data: null, total: 0, error: error.message };
  return { data, total: count || 0, error: null };
}

module.exports = {
  listPublishedYears,
  findYear,
  upsertYear,
  markYearPublished,
  upsertNationsForYear,
  findNationsForYear,
  upsertEventsForYear,
  findEvents,
};

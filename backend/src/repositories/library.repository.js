'use strict';

/**
 * library.repository.js
 *
 * All direct Supabase/PostgreSQL database access for the Library domain.
 *
 * Tables used:
 *   - library_items       (migration 003)
 *   - playback_positions  (migration 003)
 *
 * IMPORTANT: All access uses the service-role client (bypasses RLS).
 * Ownership scoping (user_id) must always be applied explicitly in queries here —
 * RLS on playback_positions is defense-in-depth, not the enforcement layer.
 */

const { supabase } = require('../services/supabase.service');

// ── library_items ────────────────────────────────────────────────────────────

/**
 * List published library items, optionally filtered by type, paginated.
 *
 * @param {object} filters
 * @param {string} [filters.item_type]
 * @param {number} [filters.page]
 * @param {number} [filters.per_page]
 * @returns {Promise<{ data: object[]|null, total: number, error: string|null }>}
 */
async function listPublishedItems(filters = {}) {
  const { item_type, page = 1, per_page = 20 } = filters;

  const safePerPage = Math.min(Math.max(1, parseInt(per_page, 10) || 20), 100);
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const from = (safePage - 1) * safePerPage;
  const to = from + safePerPage - 1;

  let query = supabase
    .from('library_items')
    .select('id, title, description, item_type, duration_seconds, metadata, published_at', {
      count: 'exact',
    })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (item_type) {
    query = query.eq('item_type', item_type);
  }

  const { data, error, count } = await query;

  if (error) return { data: null, total: 0, error: error.message };
  return { data, total: count || 0, error: null };
}

/**
 * Find a single library item by id.
 *
 * @param {string} id
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function findItemById(id) {
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ── playback_positions ──────────────────────────────────────────────────────

/**
 * Find a user's saved playback position for a library item.
 *
 * @param {string} userId
 * @param {string} itemId
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function findPlaybackPosition(userId, itemId) {
  const { data, error } = await supabase
    .from('playback_positions')
    .select('position_seconds, updated_at')
    .eq('user_id', userId)
    .eq('library_item_id', itemId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Insert or update a user's playback position for a library item.
 * Uses the unique constraint on (user_id, library_item_id).
 *
 * @param {string} userId
 * @param {string} itemId
 * @param {number} positionSeconds
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
async function upsertPlaybackPosition(userId, itemId, positionSeconds) {
  const { data, error } = await supabase
    .from('playback_positions')
    .upsert(
      {
        user_id: userId,
        library_item_id: itemId,
        position_seconds: positionSeconds,
      },
      { onConflict: 'user_id,library_item_id' }
    )
    .select('position_seconds, updated_at')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

module.exports = {
  listPublishedItems,
  findItemById,
  findPlaybackPosition,
  upsertPlaybackPosition,
};

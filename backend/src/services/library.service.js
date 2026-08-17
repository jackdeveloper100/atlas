'use strict';

/**
 * library.service.js
 *
 * Business logic layer for the Library domain.
 *
 * Sits between routes (library.routes.js) and:
 *   - libraryRepository (database access)
 *   - storageService (signed URLs from Supabase Storage)
 *
 * Authentication and subscription checks happen in route middleware,
 * not here — this service trusts that callers are already authorized.
 *
 * Phase 4 scope: audio only. Items with item_type "video" are stored for
 * forward compatibility but streaming is refused for them (see generateStreamUrl).
 */

const libraryRepository = require('../repositories/library.repository');
const storageService = require('./storage.service');

/**
 * List published library items with optional type filter and pagination.
 * Used by GET /api/library/items
 *
 * @param {object} filters
 * @returns {Promise<{ success: boolean, items: object[], total: number, error: string|null }>}
 */
async function listItems(filters = {}) {
  const { data, total, error } = await libraryRepository.listPublishedItems(filters);

  if (error) {
    return { success: false, items: [], total: 0, error };
  }

  return { success: true, items: data || [], total, error: null };
}

/**
 * Get metadata for a single published library item.
 * Used by GET /api/library/items/:id
 *
 * @param {string} id
 * @returns {Promise<{ success: boolean, item: object|null, error: string|null, notFound: boolean }>}
 */
async function getItem(id) {
  const { data, error } = await libraryRepository.findItemById(id);

  if (error) {
    return { success: false, item: null, error, notFound: false };
  }

  if (!data || !data.is_published) {
    return { success: false, item: null, error: null, notFound: true };
  }

  return { success: true, item: data, error: null, notFound: false };
}

/**
 * Generate a short-lived signed streaming URL for a published, audio-type item.
 * Used by GET /api/library/items/:id/stream-url
 *
 * @param {string} id
 * @returns {Promise<{ success: boolean, url: string|null, expiresAt: string|null, error: string|null, notFound: boolean, notAudio: boolean }>}
 */
async function generateStreamUrl(id) {
  const { data: item, error: findError } = await libraryRepository.findItemById(id);

  if (findError) {
    return { success: false, url: null, expiresAt: null, error: findError, notFound: false, notAudio: false };
  }

  if (!item || !item.is_published) {
    return { success: false, url: null, expiresAt: null, error: null, notFound: true, notAudio: false };
  }

  if (item.item_type !== 'audio' && item.item_type !== 'video') {
    return { success: false, url: null, expiresAt: null, error: null, notFound: false, notAudio: true };
  }

  if (item.metadata && item.metadata.audio_url) {
    return {
      success: true,
      url: item.metadata.audio_url,
      expiresAt: null,
      error: null,
      notFound: false,
      notAudio: false,
    };
  }

  const { success, url, expiresAt, error } = await storageService.generateSignedUrl(item.storage_path);

  if (!success) {
    return { success: false, url: null, expiresAt: null, error, notFound: false, notAudio: false };
  }

  return { success: true, url, expiresAt, error: null, notFound: false, notAudio: false };
}

/**
 * Get a user's saved playback position for a library item. Defaults to 0.
 * Used by GET /api/library/items/:id/position
 *
 * @param {string} userId
 * @param {string} itemId
 * @returns {Promise<{ success: boolean, positionSeconds: number, error: string|null, notFound: boolean }>}
 */
async function getPlaybackPosition(userId, itemId) {
  const { data: item, error: findError } = await libraryRepository.findItemById(itemId);

  if (findError) {
    return { success: false, positionSeconds: 0, error: findError, notFound: false };
  }
  if (!item || !item.is_published) {
    return { success: false, positionSeconds: 0, error: null, notFound: true };
  }

  const { data, error } = await libraryRepository.findPlaybackPosition(userId, itemId);

  if (error) {
    return { success: false, positionSeconds: 0, error, notFound: false };
  }

  return { success: true, positionSeconds: data ? data.position_seconds : 0, error: null, notFound: false };
}

/**
 * Save a user's playback position for a library item.
 * Used by PUT /api/library/items/:id/position
 *
 * @param {string} userId
 * @param {string} itemId
 * @param {number} positionSeconds
 * @returns {Promise<{ success: boolean, positionSeconds: number|null, error: string|null, notFound: boolean }>}
 */
async function savePlaybackPosition(userId, itemId, positionSeconds) {
  const { data: item, error: findError } = await libraryRepository.findItemById(itemId);

  if (findError) {
    return { success: false, positionSeconds: null, error: findError, notFound: false };
  }
  if (!item || !item.is_published) {
    return { success: false, positionSeconds: null, error: null, notFound: true };
  }

  const { data, error } = await libraryRepository.upsertPlaybackPosition(userId, itemId, positionSeconds);

  if (error) {
    return { success: false, positionSeconds: null, error, notFound: false };
  }

  return { success: true, positionSeconds: data.position_seconds, error: null, notFound: false };
}

module.exports = {
  listItems,
  getItem,
  generateStreamUrl,
  getPlaybackPosition,
  savePlaybackPosition,
};

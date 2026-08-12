'use strict';

/**
 * archive.service.js
 *
 * Business logic layer for the Archive domain.
 *
 * Sits between routes (archive.routes.js) and:
 *   - archiveRepository (database access)
 *   - storageService (snapshot JSON from Supabase Storage)
 *
 * Authentication and subscription checks happen in route middleware,
 * not here — this service trusts that callers are already authorized.
 */

const archiveRepository = require('../repositories/archive.repository');
const storageService = require('./storage.service');

/**
 * Get list of all published years with metadata.
 * Used by GET /api/archive/years
 *
 * @returns {Promise<{ success: boolean, years: object[], error: string|null }>}
 */
async function getPublishedYears() {
  const { data, error } = await archiveRepository.listPublishedYears();

  if (error) {
    return { success: false, years: [], error };
  }

  return { success: true, years: data || [], error: null };
}

/**
 * Get metadata for a single archive year.
 * Used by GET /api/archive/years/:year
 *
 * @param {number} year
 * @returns {Promise<{ success: boolean, year: object|null, error: string|null, notFound: boolean }>}
 */
async function getYearMetadata(year) {
  const { data, error } = await archiveRepository.findYear(year);

  if (error) {
    return { success: false, year: null, error, notFound: false };
  }

  if (!data) {
    return { success: false, year: null, error: null, notFound: true };
  }

  if (!data.is_published) {
    return { success: false, year: null, error: null, notFound: true };
  }

  return { success: true, year: data, error: null, notFound: false };
}

/**
 * Fetch a complete snapshot JSON for a given year.
 * Used by GET /api/archive/snapshot/:year
 *
 * - Verifies year is published in archive_years
 * - Fetches snapshot JSON from private Supabase Storage
 * - Returns parsed JSON with appropriate cache headers info
 *
 * @param {number} year
 * @returns {Promise<{ success: boolean, snapshot: object|null, error: string|null, notFound: boolean }>}
 */
async function getSnapshot(year) {
  // First check that this year is published
  const { data: yearRecord, error: findError } = await archiveRepository.findYear(year);

  if (findError) {
    return { success: false, snapshot: null, error: findError, notFound: false };
  }

  if (!yearRecord || !yearRecord.is_published) {
    return { success: false, snapshot: null, error: null, notFound: true };
  }

  // Fetch from storage
  const { success, data, error } = await storageService.getSnapshot(year);

  if (!success) {
    if (error === 'NOT_FOUND') {
      return { success: false, snapshot: null, error: null, notFound: true };
    }
    return { success: false, snapshot: null, error, notFound: false };
  }

  return { success: true, snapshot: data, error: null, notFound: false };
}

/**
 * Get nations index for a specific published year.
 * Used by GET /api/archive/years/:year/nations
 *
 * @param {number} year
 * @returns {Promise<{ success: boolean, nations: object[], error: string|null, notFound: boolean }>}
 */
async function getNationsForYear(year) {
  // Verify year is published
  const { data: yearRecord, error: findError } = await archiveRepository.findYear(year);

  if (findError) {
    return { success: false, nations: [], error: findError, notFound: false };
  }

  if (!yearRecord || !yearRecord.is_published) {
    return { success: false, nations: [], error: null, notFound: true };
  }

  const { data, error } = await archiveRepository.findNationsForYear(year);

  if (error) {
    return { success: false, nations: [], error, notFound: false };
  }

  return { success: true, nations: data || [], error: null, notFound: false };
}

/**
 * Get historical events for a year with optional filters.
 * Used by GET /api/archive/years/:year/events
 *
 * @param {number} year
 * @param {object} filters
 * @param {string} [filters.event_type]
 * @param {string} [filters.nation_id]
 * @param {number} [filters.page]
 * @param {number} [filters.per_page]
 * @returns {Promise<{ success: boolean, events: object[], total: number, error: string|null, notFound: boolean }>}
 */
async function getEventsForYear(year, filters = {}) {
  // Verify year is published
  const { data: yearRecord, error: findError } = await archiveRepository.findYear(year);

  if (findError) {
    return { success: false, events: [], total: 0, error: findError, notFound: false };
  }

  if (!yearRecord || !yearRecord.is_published) {
    return { success: false, events: [], total: 0, error: null, notFound: true };
  }

  const { data, total, error } = await archiveRepository.findEvents({
    year,
    ...filters,
  });

  if (error) {
    return { success: false, events: [], total: 0, error, notFound: false };
  }

  return { success: true, events: data || [], total: total || 0, error: null, notFound: false };
}

module.exports = {
  getPublishedYears,
  getYearMetadata,
  getSnapshot,
  getNationsForYear,
  getEventsForYear,
};

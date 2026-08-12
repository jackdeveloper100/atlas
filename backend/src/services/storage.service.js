'use strict';

/**
 * storage.service.js
 *
 * Abstraction layer over Supabase Storage for snapshot files.
 *
 * DESIGN DECISION (D-004, D-018):
 *   - Provider: Supabase Storage at launch
 *   - Bucket: "snapshots" (PRIVATE — not publicly accessible)
 *   - Path pattern: snapshots/year-YYYY.json
 *   - To swap to Cloudflare R2: replace this file only
 *
 * SECURITY:
 *   - Uses service-role Supabase client (backend only)
 *   - Year parameter is strictly validated before constructing paths
 *   - No user-supplied strings are concatenated directly into paths
 *   - Snapshots are immutable once written
 */

const fs = require('fs');
const { supabase } = require('./supabase.service');

/** Name of the private Supabase Storage bucket */
const BUCKET = process.env.SNAPSHOTS_BUCKET || 'snapshots';

/**
 * Validate that a year is a safe integer in range 0–9999.
 * Throws if invalid to prevent path traversal.
 *
 * @param {*} year
 * @returns {number} validated integer year
 */
function validateYear(year) {
  const n = Number(year);
  if (!Number.isInteger(n) || n < 0 || n > 9999) {
    throw new Error(`Invalid year: ${year}. Must be an integer between 0 and 9999.`);
  }
  return n;
}

/**
 * Build the canonical storage key for a given year.
 * Output is always: year-YYYY.json (zero-padded to 4 digits)
 *
 * @param {number} year
 * @returns {string} e.g. "year-0000.json"
 */
function buildSnapshotKey(year) {
  return `year-${String(year).padStart(4, '0')}.json`;
}

/**
 * Upload a snapshot file to Supabase Storage.
 * Snapshots are stored at: snapshots/year-YYYY.json
 *
 * @param {number} year - Simulation year (0–9999)
 * @param {string} filePath - Absolute path to the local JSON file
 * @returns {Promise<{ success: boolean, storageKey: string, error: string|null }>}
 */
async function uploadSnapshot(year, filePath) {
  try {
    const validYear = validateYear(year);
    const key = buildSnapshotKey(validYear);

    // Read file from disk
    if (!fs.existsSync(filePath)) {
      return { success: false, storageKey: null, error: `File not found: ${filePath}` };
    }

    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, fileBuffer, {
        contentType: 'application/json',
        upsert: false,  // Do NOT silently overwrite existing immutable snapshots
        cacheControl: '31536000',  // 1 year cache — snapshots are immutable
      });

    if (error) {
      // If file already exists, return specific error to let caller decide
      if (error.message && error.message.includes('already exists')) {
        return { success: false, storageKey: key, error: 'ALREADY_EXISTS' };
      }
      return { success: false, storageKey: null, error: error.message };
    }

    return { success: true, storageKey: key, error: null };
  } catch (err) {
    return { success: false, storageKey: null, error: err.message };
  }
}

/**
 * Download a snapshot from Supabase Storage and return parsed JSON.
 * Used by the Archive API to serve snapshot data to subscribers.
 *
 * @param {number} year - Simulation year (0–9999)
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
async function getSnapshot(year) {
  try {
    const validYear = validateYear(year);
    const key = buildSnapshotKey(validYear);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(key);

    if (error) {
      if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
        return { success: false, data: null, error: 'NOT_FOUND' };
      }
      return { success: false, data: null, error: error.message };
    }

    // Supabase Storage download() returns a Blob
    const text = await data.text();
    const parsed = JSON.parse(text);

    return { success: true, data: parsed, error: null };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Download raw snapshot buffer (for streaming or checksum verification).
 *
 * @param {number} year - Simulation year (0–9999)
 * @returns {Promise<{ success: boolean, buffer: Buffer|null, error: string|null }>}
 */
async function getSnapshotRaw(year) {
  try {
    const validYear = validateYear(year);
    const key = buildSnapshotKey(validYear);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(key);

    if (error) {
      return { success: false, buffer: null, error: error.message };
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { success: true, buffer, error: null };
  } catch (err) {
    return { success: false, buffer: null, error: err.message };
  }
}

/**
 * Check whether a snapshot exists in storage without downloading it.
 *
 * @param {number} year - Simulation year (0–9999)
 * @returns {Promise<{ exists: boolean, error: string|null }>}
 */
async function snapshotExists(year) {
  try {
    const validYear = validateYear(year);
    const key = buildSnapshotKey(validYear);

    // List with a prefix filter to check existence efficiently
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', {
        search: key,
        limit: 1,
      });

    if (error) {
      return { exists: false, error: error.message };
    }

    const found = Array.isArray(data) && data.some(f => f.name === key);
    return { exists: found, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

/**
 * List all snapshot files currently in storage.
 *
 * @returns {Promise<{ success: boolean, snapshots: string[], error: string|null }>}
 */
async function listSnapshots() {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', {
        limit: 10000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      return { success: false, snapshots: [], error: error.message };
    }

    // Filter to only valid snapshot filenames
    const snapshots = (data || [])
      .map(f => f.name)
      .filter(name => /^year-\d{4}\.json$/.test(name));

    return { success: true, snapshots, error: null };
  } catch (err) {
    return { success: false, snapshots: [], error: err.message };
  }
}

// ── Library (Phase 4) ────────────────────────────────────────────────────────
//
// Separate private bucket from snapshots. Audio only in Phase 4; storage_path
// values are opaque strings from library_items (validated at ingestion time,
// not reconstructed from user input), so no path-building helper is needed
// here the way buildSnapshotKey() is for snapshots.

/** Name of the private Supabase Storage bucket for Library media */
const LIBRARY_BUCKET = process.env.LIBRARY_BUCKET || 'library';

/** Signed URL lifetime for Library streaming, in seconds (D-014: short-lived) */
const LIBRARY_SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Upload a local audio file to the private "library" bucket.
 *
 * @param {string} storagePath - Destination path within the bucket, e.g. "library/{uuid}.mp3"
 * @param {string} filePath - Absolute path to the local audio file
 * @param {string} [contentType] - MIME type (default: audio/mpeg)
 * @returns {Promise<{ success: boolean, storagePath: string|null, error: string|null }>}
 */
async function uploadLibraryAudio(storagePath, filePath, contentType = 'audio/mpeg') {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, storagePath: null, error: `File not found: ${filePath}` };
    }

    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      return { success: false, storagePath: null, error: error.message };
    }

    return { success: true, storagePath, error: null };
  } catch (err) {
    return { success: false, storagePath: null, error: err.message };
  }
}

/**
 * Generate a short-lived signed URL for streaming a Library audio file.
 * Never returns a permanent/public URL (D-014).
 *
 * @param {string} storagePath - Path within the "library" bucket (from library_items.storage_path)
 * @returns {Promise<{ success: boolean, url: string|null, expiresAt: string|null, error: string|null }>}
 */
async function generateLibrarySignedUrl(storagePath) {
  try {
    const { data, error } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .createSignedUrl(storagePath, LIBRARY_SIGNED_URL_TTL_SECONDS);

    if (error) {
      return { success: false, url: null, expiresAt: null, error: error.message };
    }

    const expiresAt = new Date(Date.now() + LIBRARY_SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    return { success: true, url: data.signedUrl, expiresAt, error: null };
  } catch (err) {
    return { success: false, url: null, expiresAt: null, error: err.message };
  }
}

module.exports = {
  uploadSnapshot,
  getSnapshot,
  getSnapshotRaw,
  snapshotExists,
  listSnapshots,
  // Export for testing
  validateYear,
  buildSnapshotKey,
  BUCKET,
  // Library (Phase 4)
  uploadLibraryAudio,
  generateLibrarySignedUrl,
  LIBRARY_BUCKET,
  LIBRARY_SIGNED_URL_TTL_SECONDS,
};

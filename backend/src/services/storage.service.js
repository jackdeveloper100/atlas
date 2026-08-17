'use strict';

/**
 * storage.service.js
 *
 * Abstraction layer over Supabase Storage for Archive and Library media assets.
 */

const fs = require('fs');
const { supabase } = require('./supabase.service');

const ARCHIVE_BUCKET = process.env.ARCHIVE_BUCKET || 'archive';
const SNAPSHOTS_BUCKET = process.env.SNAPSHOTS_BUCKET || 'snapshots';
const LIBRARY_BUCKET = process.env.LIBRARY_BUCKET || 'library';
const LIBRARY_SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Helper to download old JSON snapshot during migration if needed with 3s timeout.
 */
async function getSnapshot(year) {
  try {
    const key = `year-${String(year).padStart(4, '0')}.json`;
    const downloadPromise = supabase.storage.from(SNAPSHOTS_BUCKET).download(key);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Storage download timeout')), 3000)
    );
    const result = await Promise.race([downloadPromise, timeoutPromise]);
    if (result.error) return { success: false, data: null, error: result.error.message };
    const text = await result.data.text();
    return { success: true, data: JSON.parse(text), error: null };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Upload an Archive image asset (flag, leader portrait, map overlay).
 */
async function uploadArchiveMedia(storagePath, filePath, contentType = 'image/png') {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, storagePath: null, error: `File not found: ${filePath}` };
    }

    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from(ARCHIVE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
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
 * Generate a signed URL for reading private archive media assets.
 */
async function generateArchiveMediaSignedUrl(storagePath, ttlSeconds = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(ARCHIVE_BUCKET)
      .createSignedUrl(storagePath, ttlSeconds);

    if (error) {
      return { success: false, signedUrl: null, error: error.message };
    }

    return { success: true, signedUrl: data.signedUrl, error: null };
  } catch (err) {
    return { success: false, signedUrl: null, error: err.message };
  }
}

/**
 * Delete an archive media asset from storage.
 */
async function deleteArchiveMedia(storagePath) {
  try {
    const { error } = await supabase.storage
      .from(ARCHIVE_BUCKET)
      .remove([storagePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Upload a media asset (PDF, MP4, MP3, etc.) for a library item into Supabase Storage
 */
async function uploadLibraryMedia(storagePath, filePath, contentType) {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, storagePath: null, error: `File not found: ${filePath}` };
    }

    const fileBuffer = fs.readFileSync(filePath);
    return await uploadLibraryBuffer(storagePath, fileBuffer, contentType);
  } catch (err) {
    return { success: false, storagePath: null, error: err.message };
  }
}

/**
 * Upload a raw buffer (from Multer memoryStorage) into Supabase Storage
 */
async function uploadLibraryBuffer(storagePath, buffer, contentType) {
  try {
    let { error } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .upload(storagePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: true,
      });

    // If bucket restrictions reject the requested MIME type, fallback to application/octet-stream
    if (error && error.message && error.message.toLowerCase().includes('mime type')) {
      const fallback = await supabase.storage
        .from(LIBRARY_BUCKET)
        .upload(storagePath, buffer, {
          contentType: 'application/octet-stream',
          upsert: true,
        });
      error = fallback.error;
    }

    if (error) {
      return { success: false, storagePath: null, publicUrl: null, error: error.message };
    }

    const { data: pubData } = supabase.storage
      .from(LIBRARY_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = pubData?.publicUrl || null;

    return { success: true, storagePath, publicUrl, error: null };
  } catch (err) {
    return { success: false, storagePath: null, publicUrl: null, error: err.message };
  }
}

/**
 * Generate a signed URL for downloading/viewing a private library asset.
 */
async function generateSignedUrl(storagePath, ttlSeconds = LIBRARY_SIGNED_URL_TTL_SECONDS) {
  try {
    const { data, error } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .createSignedUrl(storagePath, ttlSeconds);

    if (error) {
      return { success: false, signedUrl: null, error: error.message };
    }

    return { success: true, signedUrl: data.signedUrl, error: null };
  } catch (err) {
    return { success: false, signedUrl: null, error: err.message };
  }
}

/**
 * Delete a media file from Supabase Storage by its path within the library bucket.
 */
async function deleteLibraryMedia(storagePath) {
  try {
    const { error } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .remove([storagePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  getSnapshot,
  uploadArchiveMedia,
  generateArchiveMediaSignedUrl,
  deleteArchiveMedia,
  uploadLibraryMedia,
  uploadLibraryBuffer,
  generateSignedUrl,
  deleteLibraryMedia,
};

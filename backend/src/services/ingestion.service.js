'use strict';

/**
 * ingestion.service.js
 *
 * Snapshot ingestion pipeline.
 *
 * Implements the full pipeline (D-021):
 *   1. Read local JSON snapshot
 *   2. Parse JSON
 *   3. Validate snapshot (schema, entities, references)
 *   4. Calculate SHA-256 checksum
 *   5. Determine year
 *   6. Check archive_years for existing record
 *      a. Same checksum → already_ingested (idempotent)
 *      b. Different checksum → conflict (refuse to overwrite)
 *   7. Upload snapshot to Supabase Storage
 *   8. Upsert archive_years metadata
 *   9. Extract + upsert nations_index
 *  10. Extract + upsert historical_events
 *  11. Mark year published
 *  12. Return detailed result
 *
 * SECURITY:
 *   - Never prints credentials
 *   - Never exposes service-role key
 *   - Year is validated before path construction
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { validateSnapshot } = require('../validators/snapshot.validator');
const storageService = require('./storage.service');
const archiveRepository = require('../repositories/archive.repository');

/**
 * Ingest a single snapshot file.
 *
 * @param {string} filePath - Absolute path to the snapshot JSON file
 * @param {object} [options]
 * @param {boolean} [options.verbose] - If true, log detailed progress
 * @returns {Promise<IngestResult>}
 *
 * @typedef {object} IngestResult
 * @property {boolean} success
 * @property {number|null} year
 * @property {'published'|'already_ingested'|'conflict'|'validation_failed'|'error'} status
 * @property {string|null} checksum
 * @property {number|null} sizeBytes
 * @property {string[]} errors
 * @property {string|null} message
 */
async function ingestSnapshot(filePath, options = {}) {
  const { verbose = false } = options;
  const log = verbose ? console.log : () => {};

  // ── Step 1: Read file ──────────────────────────────────────────────────────
  log(`  Reading: ${path.basename(filePath)}`);
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      year: null,
      status: 'error',
      checksum: null,
      sizeBytes: null,
      errors: [`File not found: ${filePath}`],
      message: 'File not found',
    };
  }

  let rawBuffer;
  try {
    rawBuffer = fs.readFileSync(filePath);
  } catch (err) {
    return {
      success: false,
      year: null,
      status: 'error',
      checksum: null,
      sizeBytes: null,
      errors: [`Failed to read file: ${err.message}`],
      message: 'File read error',
    };
  }

  const sizeBytes = rawBuffer.length;

  // ── Step 2: Parse JSON ────────────────────────────────────────────────────
  let snapshot;
  try {
    snapshot = JSON.parse(rawBuffer.toString('utf8'));
  } catch (err) {
    return {
      success: false,
      year: null,
      status: 'error',
      checksum: null,
      sizeBytes,
      errors: [`Invalid JSON: ${err.message}`],
      message: 'JSON parse error',
    };
  }

  // ── Step 3: Validate ──────────────────────────────────────────────────────
  log('  Validating...');
  const validation = validateSnapshot(snapshot);
  if (!validation.valid) {
    return {
      success: false,
      year: snapshot?.simulation?.year ?? null,
      status: 'validation_failed',
      checksum: null,
      sizeBytes,
      errors: validation.errors,
      message: `Validation failed: ${validation.errors.length} error(s)`,
    };
  }

  const year = snapshot.simulation.year;
  log(`  ✓ Valid (Year ${year}, schema ${snapshot.schema_version})`);

  // ── Step 4: Calculate SHA-256 checksum ───────────────────────────────────
  const checksum = crypto
    .createHash('sha256')
    .update(rawBuffer)
    .digest('hex');

  log(`  ✓ Checksum: ${checksum.substring(0, 16)}...`);

  // ── Step 5–6: Check for existing record ──────────────────────────────────
  const { data: existing, error: findError } = await archiveRepository.findYear(year);
  if (findError) {
    return {
      success: false,
      year,
      status: 'error',
      checksum,
      sizeBytes,
      errors: [`Database error checking year ${year}: ${findError}`],
      message: 'Database read error',
    };
  }

  if (existing) {
    if (existing.checksum_sha256 === checksum) {
      log(`  ✓ Already ingested (idempotent)`);
      return {
        success: true,
        year,
        status: 'already_ingested',
        checksum,
        sizeBytes,
        errors: [],
        message: `Year ${year} already ingested with matching checksum`,
      };
    } else {
      return {
        success: false,
        year,
        status: 'conflict',
        checksum,
        sizeBytes,
        errors: [
          `Year ${year} exists with different checksum.`,
          `  Stored:    ${existing.checksum_sha256}`,
          `  New file:  ${checksum}`,
          'Manual intervention required to replace an immutable snapshot.',
        ],
        message: 'Checksum conflict — snapshot exists with different content',
      };
    }
  }

  // ── Step 7: Upload to Supabase Storage ───────────────────────────────────
  log('  Uploading to storage...');
  const uploadResult = await storageService.uploadSnapshot(year, filePath);

  if (!uploadResult.success) {
    // If the file already exists in storage but not in DB, that's an inconsistency
    // Log and continue — we'll upsert the DB record anyway
    if (uploadResult.error !== 'ALREADY_EXISTS') {
      return {
        success: false,
        year,
        status: 'error',
        checksum,
        sizeBytes,
        errors: [`Storage upload failed: ${uploadResult.error}`],
        message: 'Upload failed',
      };
    }
    log('  ⚠ File already in storage (continuing with DB upsert)');
  } else {
    log(`  ✓ Uploaded to storage: ${uploadResult.storageKey}`);
  }

  const snapshotKey = storageService.buildSnapshotKey(year);

  // ── Step 8: Upsert archive_years ─────────────────────────────────────────
  log('  Indexing archive_years...');
  const { error: upsertYearError } = await archiveRepository.upsertYear({
    year,
    snapshot_key: snapshotKey,
    schema_version: snapshot.schema_version,
    snapshot_size_bytes: sizeBytes,
    checksum_sha256: checksum,
    is_published: false,  // will be set true at end of pipeline
  });

  if (upsertYearError) {
    return {
      success: false,
      year,
      status: 'error',
      checksum,
      sizeBytes,
      errors: [`archive_years upsert failed: ${upsertYearError}`],
      message: 'Database write error (archive_years)',
    };
  }

  // ── Step 9: Upsert nations_index ─────────────────────────────────────────
  log(`  Indexing ${snapshot.nations.length} nation(s)...`);
  const { error: nationsError } = await archiveRepository.upsertNationsForYear(
    year,
    snapshot.nations
  );

  if (nationsError) {
    return {
      success: false,
      year,
      status: 'error',
      checksum,
      sizeBytes,
      errors: [`nations_index upsert failed: ${nationsError}`],
      message: 'Database write error (nations_index)',
    };
  }

  // ── Step 10: Upsert historical_events ────────────────────────────────────
  log(`  Indexing ${snapshot.events.length} event(s)...`);
  const { error: eventsError } = await archiveRepository.upsertEventsForYear(
    year,
    snapshot.events
  );

  if (eventsError) {
    return {
      success: false,
      year,
      status: 'error',
      checksum,
      sizeBytes,
      errors: [`historical_events upsert failed: ${eventsError}`],
      message: 'Database write error (historical_events)',
    };
  }

  // ── Step 11: Mark published ───────────────────────────────────────────────
  log('  Publishing year...');
  const { error: publishError } = await archiveRepository.markYearPublished(year);

  if (publishError) {
    return {
      success: false,
      year,
      status: 'error',
      checksum,
      sizeBytes,
      errors: [`Failed to mark year published: ${publishError}`],
      message: 'Publish step failed',
    };
  }

  log(`  ✓ Year ${year} published`);

  // ── Step 12: Return result ────────────────────────────────────────────────
  return {
    success: true,
    year,
    status: 'published',
    checksum,
    sizeBytes,
    errors: [],
    message: `Year ${year} successfully ingested and published`,
  };
}

/**
 * Ingest all snapshot files in a directory.
 *
 * @param {string} dirPath - Directory containing year-YYYY.json files
 * @param {object} [options]
 * @param {boolean} [options.verbose]
 * @returns {Promise<BatchResult>}
 *
 * @typedef {object} BatchResult
 * @property {number} total
 * @property {number} published
 * @property {number} alreadyIngested
 * @property {number} conflicts
 * @property {number} failed
 * @property {IngestResult[]} results
 */
async function ingestDirectory(dirPath, options = {}) {
  const { verbose = false } = options;

  if (!fs.existsSync(dirPath)) {
    return {
      total: 0,
      published: 0,
      alreadyIngested: 0,
      conflicts: 0,
      failed: 0,
      results: [],
    };
  }

  // Find all year-YYYY.json files, sorted ascending
  const files = fs.readdirSync(dirPath)
    .filter(f => /^year-\d{4}\.json$/.test(f))
    .sort();

  const results = [];
  let published = 0;
  let alreadyIngested = 0;
  let conflicts = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (verbose) console.log(`\nIngesting ${file}...`);

    const result = await ingestSnapshot(fullPath, options);
    results.push(result);

    if (result.status === 'published') published++;
    else if (result.status === 'already_ingested') alreadyIngested++;
    else if (result.status === 'conflict') conflicts++;
    else failed++;
  }

  return {
    total: files.length,
    published,
    alreadyIngested,
    conflicts,
    failed,
    results,
  };
}

module.exports = {
  ingestSnapshot,
  ingestDirectory,
};

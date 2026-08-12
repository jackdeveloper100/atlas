'use strict';

/**
 * tests/ingestion.test.js
 *
 * Unit tests for the snapshot ingestion pipeline (Phase 3).
 * Mocks storage.service and archive.repository so no real Supabase
 * network calls are made — tests the pipeline logic (validation,
 * checksumming, idempotency, conflict detection) in isolation.
 */

require('../src/config'); // loads .env before storage.service requires the Supabase client

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

jest.mock('../src/services/storage.service');
jest.mock('../src/repositories/archive.repository');

const storageService = require('../src/services/storage.service');
const archiveRepository = require('../src/repositories/archive.repository');
const { ingestSnapshot, ingestDirectory } = require('../src/services/ingestion.service');

function validSnapshot(overrides = {}) {
  return {
    schema_version: '1.0.0',
    simulation: {
      year: 0,
      quarter: 1,
      seed: 'test-seed',
      engineVersion: '0.1.0',
      generatedAt: new Date().toISOString(),
    },
    world: {
      totalPopulation: 500000,
      nationCount: 1,
      regionCount: 1,
      leaderCount: 1,
      eventCount: 1,
    },
    nations: [
      {
        id: 'kelkelia',
        name: 'Kelkelia',
        population: 500000,
        capitalRegionId: 'kelkelia-capital',
        currentLeaderId: 'leader-kelkelia-001',
        foundedYear: -100,
        color: '#8B4513',
      },
    ],
    regions: [
      {
        id: 'kelkelia-capital',
        name: 'Kelkelia Capital',
        nationId: 'kelkelia',
        population: 500000,
        area: 100,
        urbanization: 0.7,
      },
    ],
    leaders: [
      {
        id: 'leader-kelkelia-001',
        name: 'Test Leader',
        nationId: 'kelkelia',
        birthYear: -130,
        deathYear: null,
        legitimacy: 0.8,
        influence: 0.6,
        title: 'King',
      },
    ],
    politicalStates: [
      {
        nationId: 'kelkelia',
        governmentType: 'monarchy',
        stability: 0.7,
        centralizedPower: 0.6,
        activePolicies: [],
      },
    ],
    events: [
      {
        id: 'evt-0001',
        type: 'WORLD_INITIALIZED',
        year: 0,
        quarter: 1,
        description: 'The world begins.',
        nationIds: ['kelkelia'],
      },
    ],
    ...overrides,
  };
}

function writeSnapshotFile(dir, year, snapshot) {
  const filePath = path.join(dir, `year-${String(year).padStart(4, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  return filePath;
}

describe('ingestion.service', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-ingest-'));
    jest.clearAllMocks();

    storageService.buildSnapshotKey.mockImplementation(
      (year) => `year-${String(year).padStart(4, '0')}.json`
    );
    storageService.uploadSnapshot.mockResolvedValue({
      success: true,
      storageKey: 'year-0000.json',
      error: null,
    });
    archiveRepository.findYear.mockResolvedValue({ data: null, error: null });
    archiveRepository.upsertYear.mockResolvedValue({ data: {}, error: null });
    archiveRepository.upsertNationsForYear.mockResolvedValue({ data: [], error: null });
    archiveRepository.upsertEventsForYear.mockResolvedValue({ data: [], error: null });
    archiveRepository.markYearPublished.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('ingestSnapshot', () => {
    it('publishes a valid, new snapshot', async () => {
      const filePath = writeSnapshotFile(tmpDir, 0, validSnapshot());

      const result = await ingestSnapshot(filePath);

      expect(result.success).toBe(true);
      expect(result.status).toBe('published');
      expect(result.year).toBe(0);
      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(storageService.uploadSnapshot).toHaveBeenCalledTimes(1);
      expect(archiveRepository.upsertYear).toHaveBeenCalledTimes(1);
      expect(archiveRepository.upsertNationsForYear).toHaveBeenCalledWith(0, expect.any(Array));
      expect(archiveRepository.upsertEventsForYear).toHaveBeenCalledWith(0, expect.any(Array));
      expect(archiveRepository.markYearPublished).toHaveBeenCalledWith(0);
    });

    it('returns validation_failed for an invalid snapshot without touching storage', async () => {
      const bad = validSnapshot();
      delete bad.world;
      const filePath = writeSnapshotFile(tmpDir, 1, bad);

      const result = await ingestSnapshot(filePath);

      expect(result.success).toBe(false);
      expect(result.status).toBe('validation_failed');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(storageService.uploadSnapshot).not.toHaveBeenCalled();
    });

    it('is idempotent when checksum matches an existing record', async () => {
      const snapshot = validSnapshot();
      const filePath = writeSnapshotFile(tmpDir, 0, snapshot);
      const raw = fs.readFileSync(filePath);
      const checksum = crypto.createHash('sha256').update(raw).digest('hex');

      archiveRepository.findYear.mockResolvedValue({
        data: { year: 0, checksum_sha256: checksum },
        error: null,
      });

      const result = await ingestSnapshot(filePath);

      expect(result.success).toBe(true);
      expect(result.status).toBe('already_ingested');
      expect(storageService.uploadSnapshot).not.toHaveBeenCalled();
      expect(archiveRepository.upsertYear).not.toHaveBeenCalled();
    });

    it('refuses to overwrite when checksum differs (conflict)', async () => {
      const filePath = writeSnapshotFile(tmpDir, 0, validSnapshot());

      archiveRepository.findYear.mockResolvedValue({
        data: { year: 0, checksum_sha256: 'a'.repeat(64) },
        error: null,
      });

      const result = await ingestSnapshot(filePath);

      expect(result.success).toBe(false);
      expect(result.status).toBe('conflict');
      expect(storageService.uploadSnapshot).not.toHaveBeenCalled();
    });

    it('returns an error result for a missing file', async () => {
      const result = await ingestSnapshot(path.join(tmpDir, 'does-not-exist.json'));

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
    });

    it('returns an error result for invalid JSON', async () => {
      const filePath = path.join(tmpDir, 'year-0002.json');
      fs.writeFileSync(filePath, '{ not valid json');

      const result = await ingestSnapshot(filePath);

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
    });
  });

  describe('ingestDirectory', () => {
    it('ingests every year-YYYY.json file in the directory and summarizes results', async () => {
      writeSnapshotFile(tmpDir, 0, validSnapshot());
      writeSnapshotFile(tmpDir, 1, validSnapshot({ simulation: { ...validSnapshot().simulation, year: 1 } }));
      fs.writeFileSync(path.join(tmpDir, 'not-a-snapshot.txt'), 'ignore me');

      const batch = await ingestDirectory(tmpDir);

      expect(batch.total).toBe(2);
      expect(batch.published).toBe(2);
      expect(batch.failed).toBe(0);
      expect(batch.results).toHaveLength(2);
    });

    it('returns an empty summary for a non-existent directory', async () => {
      const batch = await ingestDirectory(path.join(tmpDir, 'nope'));
      expect(batch.total).toBe(0);
      expect(batch.results).toHaveLength(0);
    });
  });
});

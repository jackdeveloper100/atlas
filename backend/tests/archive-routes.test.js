'use strict';

/**
 * tests/archive-routes.test.js
 *
 * Archive route logic tests (Phase 5.5 — Archive completion) — success paths,
 * 404s, and filter validation, complementing the auth-gating smoke tests in
 * archive.test.js.
 *
 * Mounts the real archive.routes.js router with authenticate/requireSubscription
 * /archive.service mocked via jest.mock — same technique as
 * library-routes.test.js. Kept in its own file because jest.mock is
 * file-scoped/hoisted.
 */

require('../src/config'); // loads .env before automocking introspects the real modules

const request = require('supertest');

jest.mock('../src/middleware/authenticate');
jest.mock('../src/middleware/requireSubscription');
jest.mock('../src/services/archive.service');

describe('Archive Endpoints (mocked auth)', () => {
  let app;
  let authenticate;
  let requireSubscription;
  let archiveService;

  const USER_ID = 'user-abc-123';

  beforeAll(() => {
    const express = require('express');
    authenticate = require('../src/middleware/authenticate');
    requireSubscription = require('../src/middleware/requireSubscription');
    archiveService = require('../src/services/archive.service');
    const archiveRoutes = require('../src/routes/archive.routes');

    app = express();
    app.use(express.json());
    app.use('/api/archive', archiveRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: USER_ID };
      next();
    });
    requireSubscription.mockImplementation((req, res, next) => {
      req.subscription = { status: 'active' };
      next();
    });
  });

  it('rejects an authenticated but unsubscribed user with 403', async () => {
    requireSubscription.mockImplementation((req, res) =>
      res.status(403).json({ success: false, data: null, error: 'Active subscription required' })
    );

    const res = await request(app).get('/api/archive/years');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  describe('GET /years', () => {
    it('returns the published years list wrapped in { years, total }', async () => {
      archiveService.getPublishedYears.mockResolvedValue({
        success: true,
        years: [{ year: 0 }, { year: 5 }, { year: 10 }],
        error: null,
      });

      const res = await request(app).get('/api/archive/years');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.years).toHaveLength(3);
      expect(res.body.data.total).toBe(3);
    });
  });

  describe('GET /years/:year', () => {
    it('rejects a non-numeric year with 400', async () => {
      const res = await request(app).get('/api/archive/years/not-a-year');
      expect(res.status).toBe(400);
      expect(archiveService.getYearMetadata).not.toHaveBeenCalled();
    });

    it('returns 404 for an unpublished/missing year', async () => {
      archiveService.getYearMetadata.mockResolvedValue({
        success: false,
        year: null,
        error: null,
        notFound: true,
      });

      const res = await request(app).get('/api/archive/years/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns metadata for a published year', async () => {
      archiveService.getYearMetadata.mockResolvedValue({
        success: true,
        year: { year: 5, is_published: true, schema_version: '1.0.0' },
        error: null,
        notFound: false,
      });

      const res = await request(app).get('/api/archive/years/5');

      expect(res.status).toBe(200);
      expect(res.body.data.year).toBe(5);
    });
  });

  describe('GET /snapshot/:year', () => {
    it('returns the full snapshot JSON unmodified with immutable cache headers', async () => {
      const snapshot = {
        schema_version: '1.0.0',
        simulation: { year: 0, quarter: 1 },
        world: { totalPopulation: 100, nationCount: 1, regionCount: 1, leaderCount: 1, eventCount: 1 },
        nations: [{ id: 'n1', name: 'Test Nation' }],
        regions: [],
        leaders: [],
        politicalStates: [],
        events: [],
      };
      archiveService.getSnapshot.mockResolvedValue({
        success: true,
        snapshot,
        error: null,
        notFound: false,
      });

      const res = await request(app).get('/api/archive/snapshot/0');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(snapshot);
      expect(res.headers['cache-control']).toContain('immutable');
    });

    it('returns 404 when the snapshot year is not published', async () => {
      archiveService.getSnapshot.mockResolvedValue({
        success: false,
        snapshot: null,
        error: null,
        notFound: true,
      });

      const res = await request(app).get('/api/archive/snapshot/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /years/:year/nations', () => {
    it('returns the nations index for a published year', async () => {
      archiveService.getNationsForYear.mockResolvedValue({
        success: true,
        nations: [{ nation_id: 'kelkelia', name: 'Kelkelia', population: 500000, is_active: true }],
        error: null,
        notFound: false,
      });

      const res = await request(app).get('/api/archive/years/0/nations');

      expect(res.status).toBe(200);
      expect(res.body.data.nations).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /years/:year/events', () => {
    it('rejects an invalid event_type filter with 400', async () => {
      const res = await request(app).get('/api/archive/years/0/events?event_type=bad space');
      expect(res.status).toBe(400);
      expect(archiveService.getEventsForYear).not.toHaveBeenCalled();
    });

    it('passes validated filters through to the service and returns paginated events', async () => {
      archiveService.getEventsForYear.mockResolvedValue({
        success: true,
        events: [{ event_id: 'event-world-init', event_type: 'WORLD_INITIALIZED' }],
        total: 1,
        error: null,
        notFound: false,
      });

      const res = await request(app).get(
        '/api/archive/years/0/events?event_type=WORLD_INITIALIZED&nation_id=kelkelia&page=1&per_page=20'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(1);
      expect(archiveService.getEventsForYear).toHaveBeenCalledWith(0, {
        event_type: 'WORLD_INITIALIZED',
        nation_id: 'kelkelia',
        page: 1,
        per_page: 20,
      });
    });
  });
});

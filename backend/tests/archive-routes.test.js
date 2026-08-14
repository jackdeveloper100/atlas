'use strict';

/**
 * tests/archive-routes.test.js
 *
 * Archive route logic tests with mocked service layer.
 */

require('../src/config');

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

  describe('GET /:year', () => {
    it('rejects a non-numeric year with 400', async () => {
      const res = await request(app).get('/api/archive/not-a-year');
      expect(res.status).toBe(400);
      expect(archiveService.getYear).not.toHaveBeenCalled();
    });

    it('returns 404 for an unpublished/missing year', async () => {
      archiveService.getYear.mockResolvedValue({
        success: false,
        data: null,
        error: null,
        notFound: true,
      });

      const res = await request(app).get('/api/archive/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns composed relational data for a published year', async () => {
      const yearPayload = {
        year: { year: 5, isPublished: true },
        nations: [{ id: 'n1', name: 'Ashen Run' }],
        regions: [{ id: 'r1', name: 'Amber Vale' }],
        leaders: [],
        events: [],
        tabs: [],
        entities: {},
      };

      archiveService.getYear.mockResolvedValue({
        success: true,
        data: yearPayload,
        error: null,
        notFound: false,
      });

      const res = await request(app).get('/api/archive/5');

      expect(res.status).toBe(200);
      expect(res.body.data.nations).toHaveLength(1);
    });
  });
});

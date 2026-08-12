'use strict';

/**
 * tests/library-routes.test.js
 *
 * Library route logic tests (Phase 4) — subscription gating (403),
 * validation (400), not-found (404), signed-URL generation, and
 * playback-position ownership.
 *
 * The existing middleware.test.js explicitly leaves 403/subscribed-path
 * testing as a placeholder ("should be tested with valid auth token in
 * integration tests") because no test-user JWT fixture exists in this repo.
 * Rather than leave the same gap for Library, this file mounts the real
 * library.routes.js router with authenticate/requireSubscription/
 * library.service mocked via jest.mock — the same technique already used in
 * ingestion.test.js — so the actual route logic is exercised with real
 * assertions instead of a no-op.
 *
 * Kept in its own file (not alongside library.test.js) because jest.mock is
 * file-scoped and hoisted: mixing it with the real-app 401 tests would
 * silently replace authenticate/requireSubscription there too.
 */

require('../src/config'); // loads .env before automocking introspects the real modules

const request = require('supertest');

jest.mock('../src/middleware/authenticate');
jest.mock('../src/middleware/requireSubscription');
jest.mock('../src/services/library.service');

describe('Library Endpoints (mocked auth)', () => {
  let app;
  let authenticate;
  let requireSubscription;
  let libraryService;

  const VALID_ID = '11111111-1111-1111-1111-111111111111';
  const USER_ID = 'user-abc-123';

  beforeAll(() => {
    const express = require('express');
    authenticate = require('../src/middleware/authenticate');
    requireSubscription = require('../src/middleware/requireSubscription');
    libraryService = require('../src/services/library.service');
    const libraryRoutes = require('../src/routes/library.routes');

    app = express();
    app.use(express.json());
    app.use('/api/library', libraryRoutes);
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

    const res = await request(app).get('/api/library/items');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns published items for a subscribed user', async () => {
    libraryService.listItems.mockResolvedValue({
      success: true,
      items: [{ id: VALID_ID, title: 'Test Track', item_type: 'audio' }],
      total: 1,
      error: null,
    });

    const res = await request(app).get('/api/library/items');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('rejects a malformed item id with 400', async () => {
    const res = await request(app).get('/api/library/items/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(libraryService.getItem).not.toHaveBeenCalled();
  });

  it('returns 404 for a well-formed but unpublished/missing item', async () => {
    libraryService.getItem.mockResolvedValue({ success: false, item: null, error: null, notFound: true });

    const res = await request(app).get(`/api/library/items/${VALID_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('generates a signed stream URL for a published audio item', async () => {
    libraryService.generateStreamUrl.mockResolvedValue({
      success: true,
      url: 'https://storage.supabase.co/signed/example?token=abc',
      expiresAt: '2026-08-11T11:00:00.000Z',
      error: null,
      notFound: false,
      notAudio: false,
    });

    const res = await request(app).get(`/api/library/items/${VALID_ID}/stream-url`);

    expect(res.status).toBe(200);
    expect(res.body.data.url).toContain('token=');
    expect(res.body.data.expires_at).toBe('2026-08-11T11:00:00.000Z');
  });

  it('refuses to stream a non-audio (video) item', async () => {
    libraryService.generateStreamUrl.mockResolvedValue({
      success: false,
      url: null,
      expiresAt: null,
      error: null,
      notFound: false,
      notAudio: true,
    });

    const res = await request(app).get(`/api/library/items/${VALID_ID}/stream-url`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a missing position_seconds body with 400', async () => {
    const res = await request(app).put(`/api/library/items/${VALID_ID}/position`).send({});
    expect(res.status).toBe(400);
    expect(libraryService.savePlaybackPosition).not.toHaveBeenCalled();
  });

  it('rejects a negative position_seconds with 400', async () => {
    const res = await request(app)
      .put(`/api/library/items/${VALID_ID}/position`)
      .send({ position_seconds: -5 });

    expect(res.status).toBe(400);
    expect(libraryService.savePlaybackPosition).not.toHaveBeenCalled();
  });

  it('rejects a non-integer position_seconds with 400', async () => {
    const res = await request(app)
      .put(`/api/library/items/${VALID_ID}/position`)
      .send({ position_seconds: 12.5 });

    expect(res.status).toBe(400);
    expect(libraryService.savePlaybackPosition).not.toHaveBeenCalled();
  });

  it('saves position using the authenticated user id, ignoring any client-supplied user_id', async () => {
    libraryService.savePlaybackPosition.mockResolvedValue({
      success: true,
      positionSeconds: 42,
      error: null,
      notFound: false,
    });

    const res = await request(app)
      .put(`/api/library/items/${VALID_ID}/position`)
      .send({ position_seconds: 42, user_id: 'someone-elses-id' });

    expect(res.status).toBe(200);
    expect(libraryService.savePlaybackPosition).toHaveBeenCalledWith(USER_ID, VALID_ID, 42);
  });

  it('reads position for the authenticated user only', async () => {
    libraryService.getPlaybackPosition.mockResolvedValue({
      success: true,
      positionSeconds: 17,
      error: null,
      notFound: false,
    });

    const res = await request(app).get(`/api/library/items/${VALID_ID}/position`);

    expect(res.status).toBe(200);
    expect(res.body.data.position_seconds).toBe(17);
    expect(libraryService.getPlaybackPosition).toHaveBeenCalledWith(USER_ID, VALID_ID);
  });
});

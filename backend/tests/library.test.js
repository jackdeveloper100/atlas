'use strict';

/**
 * tests/library.test.js
 *
 * Library API endpoint tests (Phase 4) — real app, no token, expect 401.
 * Mirrors archive.test.js / auth.test.js exactly — the existing convention
 * in this codebase for auth gating.
 *
 * Subscription gating (403), validation, not-found, signed-URL generation,
 * and playback-position ownership are covered separately in
 * tests/library-routes.test.js, which mocks authenticate/requireSubscription
 * and therefore must not share a file with these real-app tests (jest.mock
 * is file-scoped and would silently break the real app's auth middleware
 * here too).
 */

const request = require('supertest');

describe('Library Endpoints (unauthenticated)', () => {
  const app = require('../src/app');

  it('GET /api/library/items -> 401', async () => {
    const res = await request(app).get('/api/library/items');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/library/items/:id -> 401', async () => {
    const res = await request(app).get('/api/library/items/11111111-1111-1111-1111-111111111111');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/library/items/:id/stream-url -> 401', async () => {
    const res = await request(app).get('/api/library/items/11111111-1111-1111-1111-111111111111/stream-url');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/library/items/:id/position -> 401', async () => {
    const res = await request(app).get('/api/library/items/11111111-1111-1111-1111-111111111111/position');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/library/items/:id/position -> 401', async () => {
    const res = await request(app)
      .put('/api/library/items/11111111-1111-1111-1111-111111111111/position')
      .send({ position_seconds: 10 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

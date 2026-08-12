'use strict';

/**
 * tests/archive.test.js
 *
 * Archive API endpoint tests (Phase 3).
 * Follows the same convention as auth.test.js / subscription.test.js:
 * verifies auth/subscription gating without requiring a live database.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Archive Endpoints', () => {
  describe('GET /api/archive/years', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/archive/years');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/archive/years')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/archive/years/:year', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/archive/years/5');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/archive/snapshot/:year', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/archive/snapshot/5');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/archive/years/:year/nations', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/archive/years/5/nations');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/archive/years/:year/events', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/archive/years/5/events');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request with query filters', async () => {
      const res = await request(app).get(
        '/api/archive/years/5/events?event_type=LEADER_SUCCESSION&nation_id=kelkelia'
      );

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Response envelope', () => {
    it('always returns the { success, data, error } contract on auth failure', async () => {
      const res = await request(app).get('/api/archive/years');

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('error');
      expect(res.body.data).toBeNull();
      expect(typeof res.body.error).toBe('string');
    });
  });
});

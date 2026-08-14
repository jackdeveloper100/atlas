'use strict';

/**
 * tests/archive.test.js
 *
 * Archive API endpoint authentication tests (Relational Model).
 */

const request = require('supertest');
const app = require('../src/app');

describe('Archive Endpoints (Unauthenticated Gating)', () => {
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

  describe('GET /api/archive/:year', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/archive/5');
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
